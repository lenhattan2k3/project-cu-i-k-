import Promotion from "../models/promotionModel.js";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

// 🔹 Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    } = req.body;

    // 🔸 Kiểm tra trùng mã
    const existing = await Promotion.findOne({ code });
    if (existing) {
      return res.status(400).json({ message: "❌ Mã khuyến mãi đã tồn tại!" });
    }

    // 🔸 Upload trực tiếp ảnh từ buffer lên Cloudinary
    let imageUrl = "";
    if (req.file) {
      const bufferStream = streamifier.createReadStream(req.file.buffer);
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "promotions" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        bufferStream.pipe(stream);
      });
      imageUrl = uploadResult.secure_url;
    }

    // 🔸 Tạo document mới trong MongoDB
    const newPromotion = await Promotion.create({
      code,
      discountType,
      discountValue,
      maxUsage,
      startDate,
      endDate,
      description,
      image: imageUrl,
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
    const promotions = await Promotion.find().sort({ createdAt: -1 });
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
    const promotion = await Promotion.findById(id);
    if (!promotion) {
      return res.status(404).json({ message: "❌ Không tìm thấy khuyến mãi!" });
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
    const { code, totalAmount } = req.body;
    const promo = await Promotion.findOne({ code });
    if (!promo)
      return res.status(404).json({ message: "❌ Mã khuyến mãi không tồn tại!" });

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
