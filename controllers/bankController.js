import BankLink from "../models/BankLink.js";

// 🔹 Liên kết ngân hàng
export const linkBank = async (req, res) => {
  try {
    const { userId, bankName, accountNumber, accountHolder } = req.body;

    // Validation cơ bản
    if (!userId || !bankName || !accountNumber || !accountHolder) {
      return res.status(400).json({ error: "Vui lòng gửi đầy đủ thông tin" });
    }

    // Kiểm tra xem user đã có liên kết chưa
    let bank = await BankLink.findOne({ userId });

    if (bank) {
      // Cập nhật thông tin
      bank.bankName = bankName;
      bank.accountNumber = accountNumber;
      bank.accountHolder = accountHolder;
      bank.active = true;
      bank.linkedAt = new Date();
      await bank.save();
      return res.json({ success: true, message: "Cập nhật liên kết ngân hàng thành công" });
    }

    // Nếu chưa có → tạo mới
    bank = new BankLink({ userId, bankName, accountNumber, accountHolder });
    await bank.save();

    res.json({ success: true, message: "Liên kết ngân hàng thành công" });
  } catch (err) {
    console.error("❌ Lỗi linkBank:", err);
    res.status(500).json({ error: "Lỗi server, không thể liên kết ngân hàng" });
  }
};

// 🔹 Lấy thông tin ngân hàng theo userId
export const getBankByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "Thiếu userId" });

    const bank = await BankLink.findOne({ userId, active: true });
    if (!bank) return res.json({ linked: false });

    res.json({ linked: true, bank });
  } catch (err) {
    console.error("❌ Lỗi getBankByUser:", err);
    res.status(500).json({ error: "Lỗi server, không thể lấy dữ liệu" });
  }
};

// 🔹 Hủy liên kết ngân hàng
export const unlinkBank = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "Thiếu userId" });

    const bank = await BankLink.findOne({ userId, active: true });
    if (!bank) return res.status(404).json({ error: "Không tìm thấy liên kết" });

    bank.active = false;
    await bank.save();

    res.json({ success: true, message: "Hủy liên kết ngân hàng thành công" });
  } catch (err) {
    console.error("❌ Lỗi unlinkBank:", err);
    res.status(500).json({ error: "Lỗi server, không thể hủy liên kết" });
  }
};
