  import React, { useState } from "react";
  import { useNavigate, Link } from "react-router-dom";
  import { createUserWithEmailAndPassword } from "firebase/auth";
  import { doc, setDoc } from "firebase/firestore";
  import { auth, db } from "../firebase/config";

  export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<"user" | "partner">("user");
    const [notifyEmail, setNotifyEmail] = useState(""); // 🆕 Thêm email nhận thông báo
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);

      try {
        // 1️⃣ Tạo tài khoản
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;

        // 2️⃣ Dữ liệu người dùng
        const userData = {
          uid,
          email,
          role,
          status: role === "partner" ? "pending" : "approved", // ✅ partner thì chờ duyệt, user dùng luôn


          createdAt: new Date().toISOString(),
          notifyEmail: role === "partner" ? notifyEmail : null, // 🆕 lưu thêm notifyEmail nếu là đối tác
        };

        // 3️⃣ Lưu Firestore
        await setDoc(doc(db, "users", uid), userData);

        // 4️⃣ Thông báo
        alert(
          role === "partner"
            ? "🎉 Đăng ký thành công! Tài khoản của bạn đang chờ được duyệt. Email thông báo sẽ được gửi đến: " +
                notifyEmail
            : "🎉 Đăng ký thành công! Vui lòng đăng nhập để tiếp tục."
        );

        navigate("/login");
      } catch (err: any) {
        console.error("❌ Lỗi đăng ký:", err);
        if (err.code === "auth/email-already-in-use") {
          setError("Email này đã được sử dụng!");
        } else if (err.code === "auth/weak-password") {
          setError("Mật khẩu quá yếu! (ít nhất 6 ký tự)");
        } else if (err.code === "auth/invalid-email") {
          setError("Email không hợp lệ!");
        } else {
          setError("Đăng ký thất bại. Vui lòng thử lại.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div
        style={{
          minHeight: "100vh",
          background: `
            linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)),
            url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')
          `,
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
            WebkitBackdropFilter: "blur(25px) saturate(180%)",
            borderRadius: "24px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.25)",
            width: "100%",
            maxWidth: "450px",
            padding: "50px 40px",
            textAlign: "center",
            zIndex: 3,
            border: "1px solid rgba(255, 255, 255, 0.3)",
            position: "relative",
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
              <svg
                width="50"
                height="50"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 16c0 .88.39 1.67 1 2.22v1.28c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.28c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"
                  fill="currentColor"
                />
              </svg>
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
              Tạo tài khoản để bắt đầu hành trình
            </p>
          </div>

          {/* 🧾 FORM */}
          <form onSubmit={handleSubmit}>
            {/* Email đăng nhập */}
            <input
              type="email"
              placeholder="Email đăng nhập"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "14px 18px",
                marginBottom: "14px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                background: "rgba(255,255,255,0.15)",
                color: "white",
                fontSize: "15px",
              }}
            />

            {/* Mật khẩu */}
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "14px 18px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                marginBottom: "20px",
                background: "rgba(255,255,255,0.15)",
                color: "white",
                fontSize: "15px",
              }}
            />

            {/* Chọn loại tài khoản */}
            <div style={{ marginBottom: "20px" }}>
              <p
                style={{
                  color: "#f1f5f9",
                  fontWeight: "600",
                  marginBottom: "12px",
                  fontSize: "15px",
                }}
              >
                Loại tài khoản:
              </p>
              <div style={{ display: "flex", justifyContent: "center", gap: "25px" }}>
                <label
                  style={{
                    color: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background:
                      role === "user"
                        ? "rgba(59, 130, 246, 0.2)"
                        : "transparent",
                    border:
                      role === "user"
                        ? "1px solid rgba(59, 130, 246, 0.4)"
                        : "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <input
                    type="radio"
                    checked={role === "user"}
                    onChange={() => setRole("user")}
                    style={{ marginRight: "8px", accentColor: "#3b82f6" }}
                  />
                  Khách hàng
                </label>

                <label
                  style={{
                    color: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    cursor: "pointer",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background:
                      role === "partner"
                        ? "rgba(59, 130, 246, 0.2)"
                        : "transparent",
                    border:
                      role === "partner"
                        ? "1px solid rgba(59, 130, 246, 0.4)"
                        : "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <input
                    type="radio"
                    checked={role === "partner"}
                    onChange={() => setRole("partner")}
                    style={{ marginRight: "8px", accentColor: "#3b82f6" }}
                  />
                  Đối tác
                </label>
              </div>
            </div>

            {/* 🆕 Ô nhập email nhận thông báo — chỉ hiện khi role = partner */}
            {role === "partner" && (
              <input
                type="email"
                placeholder="Email nhận thông báo"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "14px 18px",
                  marginBottom: "20px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  background: "rgba(255,255,255,0.15)",
                  color: "white",
                  fontSize: "15px",
                }}
              />
            )}

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
              {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>
          </form>

          <div style={{ marginTop: "30px", color: "#f1f5f9", fontSize: "14px" }}>
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              style={{
                color: "#60a5fa",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Đăng nhập ngay
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
  