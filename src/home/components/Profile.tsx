import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut, updateProfile, type User } from "firebase/auth";
import { auth } from "../../firebase/config";

import airplane from "../../assets/airplane.jpg";
import heroBus from "../../assets/hero-bus.jpg";
import trainStation from "../../assets/train-station.jpg";


interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  photoURL: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [loadingAvatar, setLoadingAvatar] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: "",
    phone: "",
    address: "",
    photoURL: "",
  });

  const bgImages = [airplane, heroBus, trainStation];

  // 🔄 Nền động
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // 🧠 Lấy thông tin người dùng từ Auth + LocalStorage
  useEffect(() => {
    const user: User | null = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }

    const uid = user.uid;
    const storedData = localStorage.getItem(`userProfile_${uid}`);
    const localData = storedData ? JSON.parse(storedData) : {};

    setProfile({
      name: user.displayName || localData.name || "Người dùng",
      email: user.email || "",
      phone: localData.phone || "",
      address: localData.address || "",
      photoURL:
        localData.photoURL || user.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    });
  }, [navigate]);

  // 💾 Lưu thông tin chỉnh sửa
const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  const user: User | null = auth.currentUser;
  if (!user) return;

  try {
    // ✅ Đảm bảo chỉ dùng URL hợp lệ
    const safePhotoURL =
      profile.photoURL.startsWith("https://") ||
      profile.photoURL.startsWith("http://")
        ? profile.photoURL
        : user.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    await updateProfile(user, {
      displayName: profile.name,
      photoURL: safePhotoURL,
    });

    localStorage.setItem(
      `userProfile_${user.uid}`,
      JSON.stringify({ ...profile, photoURL: safePhotoURL })
    );

    alert("✅ Thông tin đã được lưu!");
    setIsEditing(false);
  } catch (err) {
    console.error(err);
    alert("❌ Cập nhật thất bại!");
  }
};


  // 📷 Upload avatar (Base64, không dùng Storage)
// 📷 Chọn ảnh trong máy và lưu vĩnh viễn (không dùng Cloudinary)
const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = reader.result as string;

    // ✅ Cập nhật state hiển thị ảnh ngay
    setProfile((prev) => ({ ...prev, photoURL: base64 }));

    // ✅ Lưu vào localStorage để giữ ảnh vĩnh viễn
    const user = auth.currentUser;
    if (user) {
      localStorage.setItem(
        `userProfile_${user.uid}`,
        JSON.stringify({ ...profile, photoURL: base64 })
      );
    }

    alert("✅ Ảnh đã được lưu vào hồ sơ!");
  };
  reader.readAsDataURL(file);
};


  const handleEditToggle = () => setIsEditing(true);
  const handleCancel = () => setIsEditing(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      alert("Đăng xuất thành công!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      alert("Đăng xuất thất bại, vui lòng thử lại.");
    }
  };

  return (
    <div className="profile-container">
      {/* 🌌 Nền động */}
      {bgImages.map((img, i) => (
        <div
          key={i}
          className={`bg-slide ${i === bgIndex ? "active" : ""}`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}
      <div className="overlay" />

      {/* 💎 Thông tin người dùng */}
      <div className="profile-card">
        <div className="avatar-wrap">
          <label htmlFor="avatarInput">
            <img
              src={profile.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
              alt="Avatar"
              className="avatar"
              title="Bấm để thay đổi ảnh đại diện"
            />
            {loadingAvatar && <p className="loading-text">Đang tải ảnh...</p>}
          </label>
          <input
            id="avatarInput"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{ display: "none" }}
          />
        </div>

        <div className="header">
          <h2>{profile.name}</h2>
          <p>{profile.email}</p>
        </div>

        <form onSubmit={handleSave}>
          <label>👤 Họ và tên</label>
          <input
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            readOnly={!isEditing}
          />

          <label>📞 Số điện thoại</label>
          <input
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            readOnly={!isEditing}
          />

          <label>🏠 Địa chỉ</label>
          <textarea
            value={profile.address}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            readOnly={!isEditing}
          />

          <div className="btn-group">
            {!isEditing ? (
              <button type="button" className="btn primary" onClick={handleEditToggle}>
                ✏️ Chỉnh sửa
              </button>
            ) : (
              <>
                <button type="submit" className="btn success">
                  💾 Lưu
                </button>
                <button type="button" className="btn gray" onClick={handleCancel}>
                  ❌ Hủy
                </button>
              </>
            )}
            <button type="button" className="btn danger" onClick={handleLogout}>
              🚪 Đăng xuất
            </button>
          </div>
        </form>
      </div>

      {/* 🎨 CSS */}
      <style>{`
        .profile-container {
          position: relative;
          height: 100vh;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .bg-slide {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          opacity: 0;
          transform: scale(1.1);
          transition: opacity 2.5s ease, transform 10s ease;
          filter: blur(8px);
        }
        .bg-slide.active {
          opacity: 1;
          transform: scale(1.02);
        }
        .overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, rgba(0,0,0,0.5), rgba(0,0,0,0.8));
        }
        .profile-card {
          position: relative;
          z-index: 2;
          width: 420px;
          padding: 30px;
          border-radius: 20px;
          backdrop-filter: blur(12px);
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 20px rgba(0,0,0,0.3);
          border: 2px solid rgba(255,255,255,0.2);
          animation: floatUp 1.2s ease;
        }
        @keyframes floatUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        .avatar-wrap { display: flex; flex-direction: column; align-items: center; margin-bottom: 15px; }
        .avatar { width: 120px; height: 120px; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 0 25px rgba(0, 200, 255, 0.6); transition: transform 0.3s, box-shadow 0.3s; object-fit: cover; background-color: #222; }
        .avatar:hover { transform: scale(1.08); box-shadow: 0 0 35px rgba(0, 200, 255, 0.9); }
        .loading-text { color: #ccc; margin-top: 8px; font-size: 14px; }
        .header { text-align: center; color: white; margin-bottom: 15px; }
        .header h2 { font-size: 24px; background: linear-gradient(90deg, #00ffff, #00b4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .header p { font-size: 14px; opacity: 0.8; }
        label { color: #e0e0e0; font-weight: 500; display: block; margin-top: 10px; }
        input, textarea { width: 100%; padding: 10px; border-radius: 10px; border: none; margin-top: 5px; font-size: 14px; color: #fff; background: rgba(255,255,255,0.1); outline: none; transition: 0.3s; }
        input:focus, textarea:focus { background: rgba(255,255,255,0.2); box-shadow: 0 0 10px rgba(0,200,255,0.4); }
        input[readonly], textarea[readonly] { opacity: 0.7; }
        .btn-group { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
        .btn { flex: 1; padding: 10px; border: none; border-radius: 10px; color: white; font-weight: 600; cursor: pointer; transition: all 0.3s; }
        .primary { background: linear-gradient(90deg, #00b4ff, #0077ff); } .primary:hover { box-shadow: 0 0 15px #00b4ff; }
        .success { background: linear-gradient(90deg, #00ff9d, #00c47a); } .success:hover { box-shadow: 0 0 15px #00ff9d; }
        .gray { background: linear-gradient(90deg, #9ca3af, #6b7280); } .gray:hover { box-shadow: 0 0 15px #9ca3af; }
        .danger { background: linear-gradient(90deg, #ff4b4b, #d4145a); } .danger:hover { box-shadow: 0 0 15px #ff4b4b; }
      `}</style>
    </div>
  );
}
