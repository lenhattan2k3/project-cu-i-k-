import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { socket } from "../utils/socket"; // ✅ realtime

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // ✅ Khi mở trang Login → signOut để tránh tự động đăng nhập
  useEffect(() => {
    signOut(auth).catch(() => {});
  }, []);

  // 🎨 Avatar mặc định
  const generateAvatar = (nameOrEmail: string) => {
    const firstLetter = (nameOrEmail?.[0] || "?").toUpperCase();
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#3b82f6";
    ctx.fillRect(0, 0, 100, 100);
    ctx.font = "bold 50px Inter";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(firstLetter, 50, 55);
    return canvas.toDataURL("image/png");
  };

  // 🟢 Đăng nhập bằng email/mật khẩu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      const snap = await getDoc(doc(db, "users", uid));
      const data = snap.exists() ? snap.data() : null;

      if (!data) {
        setError("Tài khoản không tồn tại trong hệ thống!");
        setIsLoading(false);
        return;
      }

      // 🚫 Kiểm tra trạng thái
      if (data.status === "pending") {
        setError("Tài khoản của bạn đang chờ Admin duyệt!");
        setIsLoading(false);
        return;
      }
      if (data.status === "rejected") {
        setError("Tài khoản của bạn đã bị từ chối!");
        setIsLoading(false);
        return;
      }

      const role = data?.role ?? "user";
      const partnerId = data?.partnerId ?? "";
      let photoURL = data?.photoURL;

      if (!photoURL) {
        photoURL = generateAvatar(data?.name || email);
        await setDoc(doc(db, "users", uid), { photoURL }, { merge: true });
      }

      const userData = {
        _id: uid,
        email: data?.email || email,
        ten: data?.name || "",
        sdt: data?.phone || "",
        role,
        partnerId,
        photoURL,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      socket.emit("registerUser", uid);

      if (role === "admin") navigate("/homeadmin");
      else if (role === "partner") navigate("/homepartner");
      else navigate("/homeuser");
    } catch (err) {
      console.error(err);
      setError("Email hoặc mật khẩu không đúng!");
    } finally {
      setIsLoading(false);
    }
  };

  // 🟣 Đăng nhập Google
  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    try {
      await setPersistence(auth, browserLocalPersistence);
      const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);

      if (isLocal) {
        // Dùng popup khi chạy localhost
        let result;
        try {
          result = await signInWithPopup(auth, provider);
        } catch (popupErr: any) {
          const code = popupErr?.code || popupErr?.error?.code;
          if (
            code === "auth/popup-closed-by-user" ||
            code === "auth/cancelled-popup-request" ||
            code === "auth/popup-blocked"
          ) {
            await signInWithRedirect(auth, provider);
            return;
          }
          throw popupErr;
        }

        const user = result.user;
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          await setDoc(userRef, {
            email: user.email,
            name: user.displayName || "",
            photoURL: user.photoURL || "",
            role: "user",
            partnerId: "",
            status: "approved", // Google user auto approved
            createdAt: new Date(),
          });
        }

        const userData = {
          _id: user.uid,
          email: user.email,
          ten: user.displayName || "",
          sdt: "",
          role: "user",
          partnerId: "",
          photoURL: user.photoURL || "",
        };

        localStorage.setItem("user", JSON.stringify(userData));
        socket.emit("registerUser", user.uid);
        navigate("/homeuser");
      } else {
        await signInWithRedirect(auth, provider);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể khởi tạo đăng nhập Google!");
      setIsLoading(false);
    }
  };

  // ✅ Chỉ xử lý redirect khi thực sự có login Google
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (!result?.user) return; // không có login mới

        const user = result.user;
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (!snap.exists()) {
          await setDoc(userRef, {
            email: user.email,
            name: user.displayName || "",
            photoURL: user.photoURL || "",
            role: "user",
            partnerId: "",
            status: "approved",
            createdAt: new Date(),
          });
        }

        const userData = {
          _id: user.uid,
          email: user.email,
          ten: user.displayName || "",
          sdt: "",
          role: "user",
          partnerId: "",
          photoURL: user.photoURL || "",
        };

        localStorage.setItem("user", JSON.stringify(userData));
        socket.emit("registerUser", user.uid);
        navigate("/homeuser");
      } catch (err) {
        console.error("Google Redirect Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    handleRedirectResult();
  }, [navigate]);

  // 💅 Giao diện
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=2070&q=80')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "Inter, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {isLoading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "4px solid #3b82f6",
              borderTop: "4px solid transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <div
        style={{
          background: "rgba(255, 255, 255, 0.25)",
          backdropFilter: "blur(25px) saturate(180%)",
          borderRadius: "24px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.25)",
          width: "100%",
          maxWidth: "450px",
          padding: "50px 40px",
          textAlign: "center",
          border: "1px solid rgba(255, 255, 255, 0.3)",
        }}
      >
        <div style={{ marginBottom: "35px" }}>
          <div
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #0ea5e9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "40px",
              margin: "0 auto 20px",
              boxShadow: "0 15px 35px rgba(59, 130, 246, 0.3)",
            }}
          >
            V
          </div>
          <h2
            style={{
              fontSize: "32px",
              fontWeight: 700,
              background: "linear-gradient(135deg, #1e40af, #0ea5e9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: "0 0 8px 0",
            }}
          >
            Vexe Online
          </h2>
          <p style={{ color: "#e2e8f0", margin: "0", fontSize: "16px" }}>
            Đăng nhập để tiếp tục hành trình
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            required
            style={{
              width: "100%",
              padding: "14px 18px",
              marginBottom: "14px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              outline: "none",
              background: "rgba(255,255,255,0.15)",
              color: "white",
              fontSize: "15px",
            }}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Mật khẩu"
            required
            style={{
              width: "100%",
              padding: "14px 18px",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              outline: "none",
              marginBottom: "16px",
              background: "rgba(255,255,255,0.15)",
              color: "white",
              fontSize: "15px",
            }}
          />

          {error && (
            <div
              style={{
                background: "rgba(239, 68, 68, 0.2)",
                color: "#fecaca",
                borderRadius: "12px",
                padding: "12px 16px",
                fontSize: "14px",
                marginBottom: "20px",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                fontWeight: "500",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: "100%",
              background: isLoading
                ? "linear-gradient(135deg, #94a3b8, #64748b)"
                : "linear-gradient(135deg, #3b82f6, #0ea5e9)",
              color: "white",
              border: "none",
              padding: "16px 24px",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: isLoading ? "not-allowed" : "pointer",
              marginBottom: "12px",
              transition: "0.3s",
              boxShadow: "0 6px 20px rgba(59,130,246,0.4)",
            }}
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>

        <button
          onClick={handleGoogleLogin}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.85)",
            color: "#334155",
            border: "1px solid rgba(255,255,255,0.4)",
            padding: "14px 24px",
            borderRadius: "12px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            transition: "all 0.3s ease",
          }}
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            style={{ width: 22, height: 22 }}
          />
          Đăng nhập bằng Google
        </button>

        <div style={{ marginTop: "30px", color: "#f1f5f9", fontSize: "14px" }}>
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            style={{
              color: "#60a5fa",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Đăng ký ngay
          </Link>
        </div>

        <div style={{ marginTop: "20px" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "transparent",
              color: "#93c5fd",
              border: "none",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "color 0.3s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseOut={(e) => (e.currentTarget.style.color = "#93c5fd")}
          >
            ← Quay về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}
