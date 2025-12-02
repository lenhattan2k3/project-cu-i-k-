import React, { useEffect, useState } from "react";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase/config";

export default function PartnerProfile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>({
    name: "",
    phone: "",
    company: "",
    route: "",
    paymentMethod: "",
    photoURL: "",
    role: "",
    backgroundImage: "",
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [previewCover, setPreviewCover] = useState<string>("");
  const [showCoverEdit, setShowCoverEdit] = useState(false);
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const auth = getAuth();
  const navigate = useNavigate();

  // 🔹 Load user info
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        navigate("/login");
        return;
      }
      setUser(currentUser);

      try {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile({
            ...data,
            backgroundImage: data.backgroundImage || "",
          });
          setPreviewImage(data.photoURL || currentUser.photoURL || "");
          setPreviewCover(data.backgroundImage || "");
        } else {
          setProfile({ ...profile, email: currentUser.email });
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  // 🔹 Đăng xuất
  const handleSignOut = async () => {
    await signOut(auth);
    alert("Đăng xuất thành công!");
    navigate("/login");
  };

  // 🔹 Cập nhật text field
  const handleChange = (field: string, value: string) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  // 🔹 Resize và compress ảnh thành base64
  const resizeAndCompressImage = (
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.8
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Tính toán kích thước mới
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Không thể tạo canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL("image/jpeg", quality);
          resolve(base64);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 🔹 Upload ảnh đại diện từ máy tính - lưu base64 vào Firestore
  const handleChangePhotoURL = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng
    if (!file.type.startsWith("image/")) {
      alert("❌ Vui lòng chọn file ảnh!");
      return;
    }

    setUploadingAvatar(true);
    try {
      // Resize và compress ảnh (avatar: 400x400, quality 0.7)
      const base64String = await resizeAndCompressImage(file, 400, 400, 0.7);

      // Kiểm tra kích thước base64 (Firestore limit ~1MB)
      const base64Size = (base64String.length * 3) / 4;
      let finalBase64 = base64String;
      
      if (base64Size > 900 * 1024) {
        // Nếu vẫn quá lớn, compress thêm
        finalBase64 = await resizeAndCompressImage(file, 300, 300, 0.6);
      }
      
      // Lưu base64 vào Firestore (không dùng updateProfile vì base64 quá dài cho Firebase Auth)
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { photoURL: finalBase64 });

      // Cập nhật state
      setPreviewImage(finalBase64);
      setProfile((prev: any) => ({ ...prev, photoURL: finalBase64 }));
      
      alert("✅ Ảnh đại diện đã được cập nhật vĩnh viễn!");
    } catch (err) {
      console.error("Lỗi khi lưu ảnh đại diện:", err);
      alert("❌ Không thể lưu ảnh. Vui lòng thử lại.");
    } finally {
      setUploadingAvatar(false);
      // Reset input để có thể chọn lại file giống nhau
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  // 🔹 Upload ảnh bìa từ máy tính - lưu base64 vào Firestore
  const handleChangeCoverImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng
    if (!file.type.startsWith("image/")) {
      alert("❌ Vui lòng chọn file ảnh!");
      return;
    }

    setUploadingCover(true);
    try {
      // Resize và compress ảnh (cover: 1200x400, quality 0.7)
      let base64String = await resizeAndCompressImage(file, 1200, 400, 0.7);

      // Kiểm tra kích thước base64 (Firestore limit ~1MB)
      let base64Size = (base64String.length * 3) / 4;
      if (base64Size > 900 * 1024) {
        // Nếu vẫn quá lớn, resize nhỏ hơn và compress thêm
        base64String = await resizeAndCompressImage(file, 800, 300, 0.6);
        base64Size = (base64String.length * 3) / 4;
        
        if (base64Size > 900 * 1024) {
          // Nếu vẫn quá lớn, resize nhỏ hơn nữa
          base64String = await resizeAndCompressImage(file, 600, 200, 0.5);
        }
      }

      // Lưu base64 vào Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { backgroundImage: base64String });
      
      // Cập nhật state
      setPreviewCover(base64String);
      setProfile((prev: any) => ({
        ...prev,
        backgroundImage: base64String,
      }));
      
      alert("✅ Ảnh bìa đã được cập nhật vĩnh viễn!");
    } catch (err) {
      console.error("Lỗi khi lưu ảnh bìa:", err);
      alert("❌ Không thể lưu ảnh bìa. Vui lòng thử lại.");
    } finally {
      setUploadingCover(false);
      // Reset input để có thể chọn lại file giống nhau
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  // 🔹 Lưu cập nhật text
  const handleUpdate = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const newData = { ...profile, photoURL: previewImage };
      await updateDoc(userRef, newData);

      // Đồng bộ displayName của Firebase Auth với hồ sơ để toàn bộ hệ thống dùng chung
      if (newData.name && newData.name.trim()) {
        await updateProfile(user, { displayName: newData.name.trim() });
        setUser((prev: any) =>
          prev ? { ...prev, displayName: newData.name.trim() } : prev
        );
      }

      // Không dùng updateProfile cho photoURL vì base64 quá dài
      setProfile(newData);
      setEditing(false);
      alert("✅ Cập nhật thành công!");
    } catch (err) {
      console.error(err);
      alert("❌ Lỗi khi cập nhật thông tin!");
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingWrapper}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @media (max-width: 900px) {
            .content-grid-responsive {
              grid-template-columns: 1fr !important;
            }
            .profile-header-responsive {
              flex-direction: column !important;
              align-items: flex-start !important;
            }
            .avatar-container-responsive {
              margin-bottom: 16px !important;
            }
          }
          @media (max-width: 600px) {
            .profile-header-responsive {
              margin-top: -120px !important;
            }
            .avatar-wrapper-responsive {
              width: 120px !important;
              height: 120px !important;
            }
          }
        `}
      </style>
      <div style={styles.pageWrapper}>
        {/* 🔹 Cover Photo Section - Full Width like Facebook */}
        <div
          style={styles.coverContainer}
          onMouseEnter={() => setShowCoverEdit(true)}
          onMouseLeave={() => setShowCoverEdit(false)}
        >
        <img
          src={
            previewCover ||
            "https://i.pinimg.com/originals/3d/9b/1f/3d9b1f1877dcb23f1e8045283e6ff9f9.jpg"
          }
          alt="cover"
          style={styles.coverImage}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://via.placeholder.com/1200x400?text=Lỗi+tải+ảnh+bìa";
          }}
        />
        {/* Logout button ở góc trên bên phải */}
        <button onClick={handleSignOut} style={styles.logoutButton}>
          Đăng xuất
        </button>
        {/* Edit cover button - hiện khi hover */}
        {showCoverEdit && (
          <label style={styles.changeCoverButton}>
            <span style={styles.editIcon}>📷</span>
            {uploadingCover ? "Đang tải lên..." : "Chỉnh sửa ảnh bìa"}
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleChangeCoverImage}
              disabled={uploadingCover}
            />
          </label>
        )}
      </div>

      {/* 🔹 Main Content Container */}
      <div style={styles.mainContainer}>
        {/* 🔹 Profile Header Section - Facebook style */}
        <div style={styles.profileHeader} className="profile-header-responsive">
          {/* Avatar Section - Overlapping on cover */}
          <div style={styles.avatarContainer} className="avatar-container-responsive">
            <div
              style={styles.avatarWrapper}
              className="avatar-wrapper-responsive"
              onMouseEnter={() => setShowAvatarEdit(true)}
              onMouseLeave={() => setShowAvatarEdit(false)}
            >
              <img
                src={
                  previewImage ||
                  "https://cdn-icons-png.flaticon.com/512/3774/3774299.png"
                }
                alt="avatar"
                style={styles.avatar}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://cdn-icons-png.flaticon.com/512/3774/3774299.png";
                }}
              />
              {showAvatarEdit && (
                <label style={styles.avatarOverlay}>
                  <span style={styles.cameraIcon}>
                    {uploadingAvatar ? "⏳" : "📷"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleChangePhotoURL}
                    disabled={uploadingAvatar}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Profile Info Section */}
          <div style={styles.profileInfo}>
            <h1 style={styles.profileName}>{profile.name || "Nhà xe"}</h1>
            <p style={styles.profileEmail}>{user?.email}</p>
          </div>

          {/* Edit Profile Button */}
          <div style={styles.profileActions}>
            {!editing ? (
              <button
                style={styles.editProfileButton}
                onClick={() => setEditing(true)}
              >
                ✏️ Chỉnh sửa trang cá nhân
              </button>
            ) : (
              <div style={styles.editActions}>
                <button style={styles.saveButton} onClick={handleUpdate}>
                  ✓ Lưu thay đổi
                </button>
                <button
                  style={styles.cancelButton}
                  onClick={() => setEditing(false)}
                >
                  Hủy
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 🔹 Navigation Tabs - Facebook style */}
        <div style={styles.navTabs}>
          <div style={styles.tabActive}>Thông tin</div>
        </div>

        {/* 🔹 Content Section */}
        <div style={styles.contentWrapper}>
          {profile.role === "partner" ? (
            <div style={styles.contentGrid} className="content-grid-responsive">
              {/* Left Sidebar */}
              <div style={styles.leftSidebar}>
                <div style={styles.infoCard}>
                  <h3 style={styles.cardTitle}>Giới thiệu</h3>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>📧 Email:</span>
                    <span style={styles.infoValue}>{user?.email || "—"}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>📞 Số điện thoại:</span>
                    <span style={styles.infoValue}>
                      {profile.phone || "Chưa cập nhật"}
                    </span>
                  </div>
                </div>

                <div style={styles.infoCard}>
                  <h3 style={styles.cardTitle}>Thông tin công ty</h3>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>🏛️ Tên công ty:</span>
                    <span style={styles.infoValue}>
                      {profile.company || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>🚍 Tuyến hoạt động:</span>
                    <span style={styles.infoValue}>
                      {profile.route || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>💳 Thanh toán:</span>
                    <span style={styles.infoValue}>
                      {profile.paymentMethod || "Chưa cập nhật"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Content Area - Editable Form */}
              <div style={styles.mainContent}>
                <div style={styles.formCard}>
                  <h2 style={styles.formTitle}>
                    {editing ? "Chỉnh sửa thông tin" : "Thông tin chi tiết"}
                  </h2>
                  <div style={styles.formGrid}>
                    {[
                      {
                        field: "name",
                        label: "Tên nhà xe",
                        icon: "🏢",
                        placeholder: "Nhập tên nhà xe",
                      },
                      {
                        field: "phone",
                        label: "Số điện thoại",
                        icon: "📞",
                        placeholder: "Nhập số điện thoại",
                      },
                      {
                        field: "company",
                        label: "Tên công ty",
                        icon: "🏛️",
                        placeholder: "Nhập tên công ty",
                      },
                      {
                        field: "route",
                        label: "Tuyến hoạt động",
                        icon: "🚍",
                        placeholder: "Nhập tuyến hoạt động",
                      },
                      {
                        field: "paymentMethod",
                        label: "Phương thức thanh toán",
                        icon: "💳",
                        placeholder: "Nhập phương thức thanh toán",
                      },
                    ].map((item) => (
                      <div style={styles.formGroup} key={item.field}>
                        <label style={styles.formLabel}>
                          <span style={styles.formIcon}>{item.icon}</span>
                          {item.label}
                        </label>
                        <input
                          type="text"
                          value={profile[item.field] || ""}
                          readOnly={!editing}
                          onChange={(e) =>
                            handleChange(item.field, e.target.value)
                          }
                          placeholder={item.placeholder}
                          style={{
                            ...styles.formInput,
                            ...(editing ? styles.formInputEditing : {}),
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.notPartner}>
              <p style={styles.notPartnerText}>
                Tài khoản này không phải là đối tác
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}

// 🔹 Style - Facebook Profile Design
const styles: { [key: string]: React.CSSProperties } = {
  pageWrapper: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    fontFamily:
      "'Segoe UI', Helvetica, Arial, sans-serif",
  },
  loadingWrapper: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f0f2f5",
  },
  loadingSpinner: {
    width: "50px",
    height: "50px",
    border: "4px solid #e4e6eb",
    borderTop: "4px solid #1877f2",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    marginTop: "20px",
    fontSize: "16px",
    color: "#65676b",
    fontWeight: 500,
  },
  // 🔹 Cover Photo Section
  coverContainer: {
    position: "relative",
    width: "100%",
    height: "350px",
    overflow: "hidden",
    backgroundColor: "#d8dadf",
    cursor: "pointer",
  },
  coverImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  logoutButton: {
    position: "absolute",
    top: "16px",
    right: "16px",
    padding: "8px 16px",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    zIndex: 100,
    transition: "background-color 0.2s",
  },
  changeCoverButton: {
    position: "absolute",
    bottom: "16px",
    right: "16px",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    color: "#ffffff",
    padding: "8px 16px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "background-color 0.2s",
  },
  editIcon: {
    fontSize: "16px",
  },
  // 🔹 Main Container
  mainContainer: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "0 16px",
    position: "relative",
  },
  // 🔹 Profile Header - Facebook style
  profileHeader: {
    backgroundColor: "#ffffff",
    borderRadius: "8px 8px 0 0",
    padding: "16px",
    marginTop: "-88px",
    position: "relative",
    zIndex: 10,
    display: "flex",
    alignItems: "flex-end",
    paddingBottom: "16px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
  },
  avatarContainer: {
    marginRight: "16px",
    position: "relative",
  },
  avatarWrapper: {
    position: "relative",
    width: "168px",
    height: "168px",
    borderRadius: "50%",
    border: "4px solid #ffffff",
    overflow: "hidden",
    backgroundColor: "#e4e6eb",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
  },
  avatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
  },
  avatarEditButton: {
    width: "36px",
    height: "36px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
  },
  cameraIcon: {
    fontSize: "18px",
  },
  profileInfo: {
    flex: 1,
    paddingBottom: "8px",
  },
  profileName: {
    fontSize: "32px",
    fontWeight: 700,
    color: "#050505",
    margin: "0 0 4px 0",
    lineHeight: "1.2",
  },
  profileEmail: {
    fontSize: "15px",
    color: "#65676b",
    margin: 0,
  },
  profileActions: {
    display: "flex",
    gap: "8px",
    marginBottom: "8px",
  },
  editProfileButton: {
    padding: "8px 16px",
    backgroundColor: "#e4e6eb",
    color: "#050505",
    border: "none",
    borderRadius: "6px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  editActions: {
    display: "flex",
    gap: "8px",
  },
  saveButton: {
    padding: "8px 16px",
    backgroundColor: "#1877f2",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  cancelButton: {
    padding: "8px 16px",
    backgroundColor: "#e4e6eb",
    color: "#050505",
    border: "none",
    borderRadius: "6px",
    fontSize: "15px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  // 🔹 Navigation Tabs
  navTabs: {
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #dadde1",
    display: "flex",
    padding: "0 16px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
  tabActive: {
    padding: "16px 32px",
    fontSize: "15px",
    fontWeight: 600,
    color: "#1877f2",
    borderBottom: "3px solid #1877f2",
    cursor: "pointer",
    marginBottom: "-1px",
  },
  // 🔹 Content Wrapper
  contentWrapper: {
    padding: "16px",
    paddingTop: "0",
  },
  contentGrid: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: "16px",
    maxWidth: "100%",
  },
  // 🔹 Left Sidebar
  leftSidebar: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  infoCard: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "16px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
  },
  cardTitle: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#050505",
    margin: "0 0 16px 0",
    paddingBottom: "12px",
    borderBottom: "1px solid #dadde1",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginBottom: "12px",
  },
  infoLabel: {
    fontSize: "13px",
    color: "#65676b",
    fontWeight: 500,
  },
  infoValue: {
    fontSize: "15px",
    color: "#050505",
    fontWeight: 400,
  },
  // 🔹 Main Content
  mainContent: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "20px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
  },
  formTitle: {
    fontSize: "20px",
    fontWeight: 700,
    color: "#050505",
    margin: "0 0 20px 0",
    paddingBottom: "12px",
    borderBottom: "1px solid #dadde1",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "16px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  formLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#65676b",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  formIcon: {
    fontSize: "16px",
  },
  formInput: {
    padding: "12px",
    fontSize: "15px",
    color: "#050505",
    backgroundColor: "#f0f2f5",
    border: "1px solid #dadde1",
    borderRadius: "6px",
    outline: "none",
    transition: "border-color 0.2s, background-color 0.2s",
  },
  formInputEditing: {
    backgroundColor: "#ffffff",
    borderColor: "#1877f2",
  },
  notPartner: {
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    padding: "64px 32px",
    textAlign: "center",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.1)",
  },
  notPartnerText: {
    fontSize: "16px",
    color: "#65676b",
    margin: 0,
  },
};
