import Promotion from "../models/promotionModel.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import https from "https";

// 🔹 Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadBufferToCloudinary = (buffer, folder = "promotions") => {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    return Promise.reject(new Error("Buffer is required for upload"));
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

const downloadImageFromPrompt = (prompt) => {
  const encodedPrompt = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 100000);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&model=flux&n=1&seed=${seed}`;

  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            Accept: "image/png",
            "User-Agent": "vexe-ai-generator/1.0",
          },
        },
        (response) => {
          if (response.statusCode !== 200) {
            reject(new Error(`AI image service returned ${response.statusCode}`));
            response.resume();
            return;
          }

          const chunks = [];
          response.on("data", (chunk) => chunks.push(chunk));
          response.on("end", () => resolve(Buffer.concat(chunks)));
        }
      )
      .on("error", reject);
  });
};

const formatDateWithLocale = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    return value;
  }
};

const buildVoucherPrompt = ({
  code,
  discountType,
  discountValue,
  description,
  partnerName,
  descriptionHint,
}) => {
  const numericValue = Number(discountValue) || 0;
  const discountText =
    discountType === "percentage"
      ? `${numericValue}% off`
      : `${numericValue.toLocaleString("vi-VN")}₫ voucher`;

  const descSnippet = description?.slice(0, 120) || "special promo";
  const hintSnippet = descriptionHint?.trim()
    ? `Marketer preference: ${descriptionHint.trim().slice(0, 140)}.`
    : "";

  return `High-end voucher poster for premium bus travel brand ${partnerName || "transport partner"}.
Bold typography showing code ${code} and ${discountText}.
Modern gradient background, glassmorphism card, subtle travel icons, Vietnamese text, clean composition, 3d lighting.
Focus on readability, promo detail: ${descSnippet}. ${hintSnippet}`;
};

const generateAiVoucherImage = async (meta) => {
  try {
    const buffer = await downloadImageFromPrompt(buildVoucherPrompt(meta));
    const uploadResult = await uploadBufferToCloudinary(buffer);
    return uploadResult.secure_url;
  } catch (error) {
    console.warn("⚠️ AI banner generation failed:", error.message);
    return "";
  }
};

const buildAutoDescription = ({
  partnerName,
  code,
  discountType,
  discountValue,
  startDate,
  endDate,
  maxUsage,
  descriptionHint,
}) => {
  const readableName = partnerName || "nhà xe";
  const discountText =
    discountType === "percentage"
      ? `${discountValue}% giá vé`
      : `${Number(discountValue).toLocaleString("vi-VN")}₫ cho mỗi vé`;

  const periodText = startDate && endDate
    ? `từ ${formatDateWithLocale(startDate)} đến hết ngày ${formatDateWithLocale(endDate)}`
    : "trong thời gian có hạn";

  const usageText = maxUsage
    ? `Số lượng có hạn (${maxUsage} lượt sử dụng cho toàn bộ khách).`
    : "Áp dụng cho số lượng vé có hạn.";

  const hintText = descriptionHint?.trim()
    ? ` ${descriptionHint.trim().replace(/\s+/g, " ")}`
    : "";

  return `Nhà xe ${readableName} ưu đãi mã ${code} giảm ${discountText}. Chương trình áp dụng ${periodText}. ${usageText}${hintText ? ` ${hintText}` : ""} Hãy đặt vé ngay để giữ chỗ tốt nhất!`;
};

export const generatePromotionPreview = async (req, res) => {
  try {
    const {
      code,
      discountType = "percentage",
      discountValue = 0,
      maxUsage = 0,
      startDate,
      endDate,
      description = "",
      partnerName = "",
      autoImage = "true",
      autoDescription = "true",
      descriptionHint = "",
    } = req.body || {};

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: "Thiếu mã khuyến mãi để tạo preview" });
    }

    const wantsImage = String(autoImage).toLowerCase() !== "false";
    const wantsDescription = String(autoDescription).toLowerCase() !== "false";

    let resolvedDescription = description?.trim();
    if (wantsDescription || !resolvedDescription) {
      resolvedDescription = buildAutoDescription({
        partnerName,
        code,
        discountType,
        discountValue,
        startDate,
        endDate,
        maxUsage,
        descriptionHint,
      });
    }

    let imageDataUrl = "";
    if (wantsImage) {
      const buffer = await downloadImageFromPrompt(
        buildVoucherPrompt({
          code,
          discountType,
          discountValue,
          description: resolvedDescription,
          partnerName,
          descriptionHint,
        })
      );
      imageDataUrl = `data:image/png;base64,${buffer.toString("base64")}`;
    }

    return res.json({
      success: true,
      description: resolvedDescription,
      imageDataUrl,
    });
  } catch (error) {
    console.error("❌ generatePromotionPreview error:", error);
    return res.status(500).json({ success: false, message: "Không thể tạo preview", error: error.message });
  }
};

// 🟢 [POST] Tạo khuyến mãi mới
export const createPromotion = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discountValue,
      maxUsage,
      startDate,
      endDate,
      description,
      partnerId,
      partnerName,
      autoImage = "true",
      autoDescription = "true",
      descriptionHint = "",
    } = req.body;

    if (!partnerId) {
      return res.status(400).json({ message: "❌ Thiếu thông tin nhà xe (partnerId)!" });
    }

    // 🔸 Kiểm tra trùng mã
    const existing = await Promotion.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: "❌ Mã khuyến mãi đã tồn tại!" });
    }

    // 🔸 Upload trực tiếp ảnh từ buffer lên Cloudinary
    let imageUrl = "";
    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer);
      imageUrl = uploadResult.secure_url;
    }

    const wantsAutoImage = String(autoImage).toLowerCase() !== "false";
    const wantsAutoDescription = String(autoDescription).toLowerCase() !== "false";

    if (!imageUrl && wantsAutoImage) {
      imageUrl = await generateAiVoucherImage({
        code,
        discountType,
        discountValue,
        description,
        partnerName,
        descriptionHint,
      });
    }

    let finalDescription = description?.trim();
    if (wantsAutoDescription || !finalDescription) {
      finalDescription = buildAutoDescription({
        partnerName,
        code,
        discountType,
        discountValue,
        startDate,
        endDate,
        maxUsage,
        descriptionHint,
      });
    }

    // 🔸 Tạo document mới trong MongoDB
    const newPromotion = await Promotion.create({
      code,
      discountType,
      discountValue,
      maxUsage,
      startDate,
      endDate,
      description: finalDescription,
      image: imageUrl,
      partnerId,
      partnerName: partnerName || "",
    });

    res.status(201).json({
      message: "✅ Tạo khuyến mãi thành công!",
      promotion: newPromotion,
    });
  } catch (error) {
    console.error("❌ Lỗi tạo khuyến mãi:", error);
    res
      .status(500)
      .json({ message: "❌ Lỗi server khi tạo khuyến mãi", error: error.message });
  }
};

// 🟢 [GET] Lấy danh sách khuyến mãi
export const getPromotions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.partnerId) {
      filter.partnerId = req.query.partnerId;
    }
    const promotions = await Promotion.find(filter).sort({ createdAt: -1 });
    res.json(promotions);
  } catch (error) {
    console.error("❌ Lỗi lấy danh sách khuyến mãi:", error);
    res
      .status(500)
      .json({ message: "❌ Lỗi server khi lấy danh sách khuyến mãi", error });
  }
};

// 🗑️ [DELETE] Xóa khuyến mãi
export const deletePromotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { partnerId } = req.query;
    const promotion = await Promotion.findById(id);
    if (!promotion) {
      return res.status(404).json({ message: "❌ Không tìm thấy khuyến mãi!" });
    }

    if (partnerId && promotion.partnerId !== partnerId) {
      return res.status(403).json({ message: "❌ Bạn không có quyền xóa khuyến mãi này!" });
    }

    // 🔸 Nếu có ảnh → xóa khỏi Cloudinary
    if (promotion.image) {
      try {
        const publicId = promotion.image.split("/").slice(-1)[0].split(".")[0];
        await cloudinary.uploader.destroy(`promotions/${publicId}`);
      } catch (err) {
        console.warn("⚠️ Không thể xóa ảnh trên Cloudinary:", err.message);
      }
    }

    await Promotion.findByIdAndDelete(id);
    res.json({ message: "✅ Xóa khuyến mãi thành công!" });
  } catch (error) {
    console.error("❌ Lỗi khi xóa khuyến mãi:", error);
    res
      .status(500)
      .json({ message: "❌ Lỗi server khi xóa khuyến mãi", error: error.message });
  }
};

// 🎟️ [POST] Áp dụng mã khuyến mãi
export const applyPromotion = async (req, res) => {
  try {
    const { code, totalAmount, partnerId } = req.body;
    if (!partnerId) {
      return res.status(400).json({ message: "❌ Thiếu thông tin nhà xe!" });
    }
    const promo = await Promotion.findOne({ code });
    if (!promo)
      return res.status(404).json({ message: "❌ Mã khuyến mãi không tồn tại!" });

    if (promo.partnerId && promo.partnerId !== partnerId) {
      return res.status(403).json({ message: "❌ Mã khuyến mãi không thuộc nhà xe này!" });
    }

    // 🔸 Kiểm tra ngày hợp lệ
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    if (now < start || now > end)
      return res.status(400).json({ message: "❌ Mã khuyến mãi đã hết hạn!" });

    // 🔸 Tính giảm giá
    let discount =
      promo.discountType === "percentage"
        ? (promo.discountValue / 100) * totalAmount
        : promo.discountValue;

    const newTotal = Math.max(totalAmount - discount, 0);

    res.json({
      message: "✅ Áp dụng khuyến mãi thành công!",
      code: promo.code,
      discount,
      newTotal,
    });
  } catch (error) {
    console.error("❌ Lỗi áp dụng khuyến mãi:", error);
    res
      .status(500)
      .json({ message: "❌ Lỗi server khi áp dụng khuyến mãi", error: error.message });
  }
};
