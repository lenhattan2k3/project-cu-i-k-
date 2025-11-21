import { Point } from "../models/pointModel.js";

// 📌 Lấy điểm của user
export const getPointsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    let userPoint = await Point.findOne({ userId });
    if (!userPoint) {
      userPoint = await Point.create({ userId, points: 0 });
    }
    res.json(userPoint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➕ Cộng điểm cho user
export const addPoints = async (req, res) => {
  try {
    const { userId } = req.body;
    const { pointsToAdd } = req.body;

    let userPoint = await Point.findOne({ userId });
    if (!userPoint) {
      userPoint = await Point.create({ userId, points: 0 });
    }

    userPoint.points += pointsToAdd;
    await userPoint.save();

    res.json({
      message: `Đã cộng ${pointsToAdd} điểm cho user ${userId}`,
      data: userPoint,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 🔻 Trừ điểm
export const subtractPoints = async (req, res) => {
  try {
    const { userId } = req.body;
    const { pointsToSubtract } = req.body;

    let userPoint = await Point.findOne({ userId });
    if (!userPoint) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    userPoint.points = Math.max(0, userPoint.points - pointsToSubtract);
    await userPoint.save();

    res.json({
      message: `Đã trừ ${pointsToSubtract} điểm cho user ${userId}`,
      data: userPoint,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
