import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

admin.initializeApp();

/**
 * 🔥 Cloud Function xóa tài khoản người dùng (chỉ admin mới được phép)
 */
export const deleteUserAccount = onCall(async (request) => {
  const data = request.data as { uid: string };
  const context = request.auth;

  if (!context) {
    throw new HttpsError("unauthenticated", "Bạn chưa đăng nhập.");
  }

  const token = context.token as any;

  // ✅ Chỉ admin mới được phép
  if (token.role !== "admin") {
    throw new HttpsError("permission-denied", "Chỉ admin mới được phép xóa tài khoản.");
  }

  try {
    // 🧩 Xóa user trong Firebase Authentication
    await admin.auth().deleteUser(data.uid);

    // 🗑️ Xóa document trong Firestore (nếu tồn tại)
    await admin.firestore().collection("users").doc(data.uid).delete();

    return { message: `Đã xóa tài khoản ${data.uid} thành công.` };
  } catch (error: any) {
    console.error("Lỗi khi xóa user:", error);
    throw new HttpsError("internal", error.message);
  }
});
