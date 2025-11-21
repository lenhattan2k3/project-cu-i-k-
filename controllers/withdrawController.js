// controllers/withdrawController.js
import Withdraw from "../models/withdrawModel.js";

// 🟢 Gửi yêu cầu rút tiền
export const createWithdraw = async (req, res) => {
  try {
    const { partnerId, amount } = req.body;

    if (!partnerId || !amount) {
      return res.status(400).json({ success: false, message: "Thiếu dữ liệu" });
    }

    const withdraw = await Withdraw.create({
      partnerId,
      amount,
      status: "pending",
    });

    // ⭐ Tự động duyệt sau 30 giây
    setTimeout(async () => {
      await Withdraw.findByIdAndUpdate(withdraw._id, { status: "approved" });
      console.log(`✔ Withdraw ${withdraw._id} approved`);
    }, 30000);

    return res.status(201).json({
      success: true,
      message: "Yêu cầu rút tiền đã được tạo, vui lòng chờ duyệt",
      withdraw,
    });
  } catch (err) {
    console.error("Withdraw error:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// 🔍 Lấy lịch sử rút tiền của partner
export const getWithdrawHistory = async (req, res) => {
  try {
    const { partnerId } = req.params;

    const withdraws = await Withdraw.find({ partnerId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      withdraws,
    });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};
