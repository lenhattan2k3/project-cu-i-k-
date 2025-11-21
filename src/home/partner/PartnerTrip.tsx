import React, { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { uploadToCloudinary } from "../../api/uploadToCloudinary";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaBus,
  FaMapMarkerAlt,
  FaUsers,
  FaBuilding,
  FaImage,
  FaMoneyBill,
  FaClock,
  FaCalendarAlt,
  FaIdCard,
  FaCarSide,
} from "react-icons/fa";
import {
  getAllTrips,
  createTrip,
  updateTrip,
  deleteTrip,
} from "../../api/tripApi";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // 🔥 Dùng Firebase Auth

interface Trip {
  _id?: string;
  tenChuyen: string;
  maTai: string;
  tu: string;
  den: string;
  ngayKhoiHanh?: string;
  gioKhoiHanh?: string;
  giaVe: number;
  soLuongGhe: number;
  nhaXe: string;
  trangThai: string;
  loaiXe: string;
  hangXe: string;
  mauSac: string;
  hinhAnh?: string;
  partnerId?: string;
}

export default function PartnerTrip() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Trip>({
    tenChuyen: "",
    maTai: "",
    tu: "",
    den: "",
    giaVe: 0,
    soLuongGhe: 0,
    nhaXe: "Nhà xe đối tác",
    trangThai: "Hoạt động",
    ngayKhoiHanh: "",
    gioKhoiHanh: "",
    loaiXe: "Giường nằm",
    hangXe: "",
    mauSac: "",
  });
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [partnerId, setPartnerId] = useState<string>("");

  // ✅ Lấy user hiện tại từ Firebase Auth
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setPartnerId(user.uid);
      } else {
        setPartnerId("");
      }
    });
    return () => unsubscribe();
  }, []);

  // 🚌 Lấy danh sách chuyến xe
  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const data = await getAllTrips();
      setTrips(data);
    } catch (error) {
      console.error("❌ Lỗi khi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddForm = () => {
    setEditingTrip(null);
    setFormData({
      tenChuyen: "",
      maTai: "",
      tu: "",
      den: "",
      giaVe: 0,
      soLuongGhe: 0,
      nhaXe: "Nhà xe đối tác",
      trangThai: "Hoạt động",
      ngayKhoiHanh: "",
      gioKhoiHanh: "",
      loaiXe: "Giường nằm",
      hangXe: "",
      mauSac: "",
    });
    setSelectedImage(null);
    setPreviewImage(null);
    setShowForm(true);
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setFormData(trip);
    setPreviewImage(trip.hinhAnh || null);
    setSelectedImage(null);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 🧾 Gửi form (Thêm / Cập nhật chuyến xe)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!partnerId) {
      alert("⚠️ Bạn cần đăng nhập để thêm hoặc sửa chuyến xe!");
      return;
    }

    try {
      setUploading(true);

      let imageUrl: string | undefined = formData.hinhAnh;

      // Nếu có chọn ảnh mới → upload Cloudinary
      if (selectedImage) {
        const uploadedUrl = await uploadToCloudinary(selectedImage);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          alert("❌ Upload ảnh thất bại!");
          setUploading(false);
          return;
        }
      }

      // Dữ liệu chuyến xe
      const tripData = {
        ...formData,
        nhaXe: partnerId, // 🔥 Gán ID của partner làm nhà xe
        hinhAnh: imageUrl ?? formData.hinhAnh,
        partnerId, // vẫn giữ partnerId để tham chiếu riêng
      };
      
      if (editingTrip) {
        const updatedTrip = await updateTrip(editingTrip._id!, tripData);
        setTrips((prev) =>
          prev.map((t) => (t._id === updatedTrip._id ? updatedTrip : t))
        );
        alert("✅ Cập nhật thành công!");
      } else {
        const newTrip = await createTrip(tripData);
        setTrips((prev) => [newTrip, ...prev]);
        alert("✅ Thêm chuyến xe thành công!");
      }

      setShowForm(false);
    } catch (error) {
      console.error("❌ Lỗi khi lưu chuyến xe:", error);
      alert("❌ Lưu thất bại!");
    } finally {
      setUploading(false);
      setSelectedImage(null);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa chuyến xe này không?")) {
      try {
        await deleteTrip(id);
        setTrips((prev) => prev.filter((t) => t._id !== id));
        alert("🗑️ Xóa thành công!");
      } catch (error) {
        console.error("❌ Lỗi khi xóa:", error);
      }
    }
  };

  const styles: { [key: string]: CSSProperties } = {
    container: { height: "100vh", display: "flex", flexDirection: "column" },
    header: { display: "flex", justifyContent: "space-between", padding: 20 },
    title: { fontSize: 26, fontWeight: 700 },
    scrollArea: { flex: 1, overflowY: "auto", padding: 20 },
    cardContainer: {
      display: "grid",
      gap: 20,
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    },
    card: {
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
    cardImage: {
      width: "100%",
      height: 160,
      objectFit: "cover",
      background: "#f0f0f0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    cardContent: { padding: 16 },
    cardTitle: { fontSize: 18, fontWeight: 700, marginBottom: 10 },
    infoRow: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 14,
      marginBottom: 6,
    },
    price: {
      fontSize: 20,
      fontWeight: 700,
      color: "#2563eb",
      marginTop: 10,
    },
    actions: { display: "flex", gap: 10, marginTop: 12 },
    actionBtn: {
      flex: 1,
      padding: 8,
      borderRadius: 10,
      fontWeight: 600,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      border: "none",
    },
    editBtn: { background: "#e0f0ff", color: "#2563eb" },
    deleteBtn: { background: "#ffe0e0", color: "#d23f3f" },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          <FaBus /> Quản lý chuyến xe
        </div>
        <button
          onClick={handleOpenAddForm}
          style={{
            background: "#2563eb",
            color: "#fff",
            padding: "8px 14px",
            borderRadius: 8,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          <FaPlus /> Thêm chuyến xe
        </button>
      </div>

      <div style={styles.scrollArea}>
        {loading && <div>Đang tải dữ liệu...</div>}
        <div style={styles.cardContainer}>
          {trips.map((trip) => (
            <div key={trip._id} style={styles.card}>
              <div style={styles.cardImage}>
                {trip.hinhAnh ? (
                  <img
                    src={trip.hinhAnh}
                    alt={trip.tenChuyen}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                    }}
                  />
                ) : (
                  <FaImage size={40} color="#aaa" />
                )}
              </div>
              <div style={styles.cardContent}>
                <div style={styles.cardTitle}>{trip.tenChuyen}</div>
                <div style={styles.infoRow}>
                  <FaMapMarkerAlt /> {trip.tu} → {trip.den}
                </div>
                <div style={styles.infoRow}>
                  <FaIdCard /> Mã tài: {trip.maTai || "—"}
                </div>
                <div style={styles.infoRow}>
                  <FaCarSide /> {trip.loaiXe} ({trip.hangXe} - {trip.mauSac})
                </div>
                <div style={styles.infoRow}>
                  <FaBuilding /> {trip.nhaXe}
                </div>
                <div style={styles.infoRow}>
                  <FaCalendarAlt /> {trip.ngayKhoiHanh || "Chưa có ngày"}
                </div>
                <div style={styles.infoRow}>
                  <FaClock /> {trip.gioKhoiHanh || "Chưa có giờ"}
                </div>
                <div style={styles.infoRow}>
                  <FaUsers /> {trip.soLuongGhe} ghế
                </div>
                <div style={styles.price}>
                  <FaMoneyBill /> {trip.giaVe.toLocaleString()}₫
                </div>
                <div style={styles.actions}>
                  <button
                    style={{ ...styles.actionBtn, ...styles.editBtn }}
                    onClick={() => handleEditTrip(trip)}
                  >
                    <FaEdit /> Sửa
                  </button>
                  <button
                    style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                    onClick={() => trip._id && handleDeleteTrip(trip._id)}
                  >
                    <FaTrash /> Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 24,
              width: "100%",
              maxWidth: 600,
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                background: "#2563eb",
                padding: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "#fff",
                fontSize: 18,
              }}
            >
              {editingTrip ? "Cập nhật chuyến xe" : "Thêm chuyến xe mới"}
              <FaTimes
                style={{ cursor: "pointer" }}
                onClick={() => setShowForm(false)}
              />
            </div>

            <form
              style={{
                padding: 16,
                overflowY: "auto",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
              onSubmit={handleSubmit}
            >
              <label>Tên chuyến</label>
              <input
                name="tenChuyen"
                value={formData.tenChuyen}
                onChange={handleChange}
                placeholder="VD: Sài Gòn - Hà Nội"
                required
                style={{
                  padding: 10,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />

              <label>Mã tài</label>
              <input
                name="maTai"
                value={formData.maTai}
                onChange={handleChange}
                placeholder="Nhập mã tài"
                required
                style={{
                  padding: 10,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />

              <label>Loại xe</label>
              <select
                name="loaiXe"
                value={formData.loaiXe}
                onChange={handleChange}
                style={{
                  padding: 10,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              >
                <option value="Giường nằm">Giường nằm</option>
                <option value="Limousine giường nằm">
                  Limousine giường nằm
                </option>
                <option value="VIP giường nằm">VIP giường nằm</option>
              </select>

              <label>Hãng xe</label>
              <input
                name="hangXe"
                value={formData.hangXe}
                onChange={handleChange}
                placeholder="VD: Thaco, Hyundai..."
                style={{
                  padding: 10,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />

              <label>Màu sắc</label>
              <input
                name="mauSac"
                value={formData.mauSac}
                onChange={handleChange}
                placeholder="VD: Đỏ, trắng, đen..."
                style={{
                  padding: 10,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />

              <label>Điểm đi</label>
              <input
                name="tu"
                value={formData.tu}
                onChange={handleChange}
                placeholder="Nhập điểm đi"
                required
                style={{
                  padding: 10,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />

              <label>Điểm đến</label>
              <input
                name="den"
                value={formData.den}
                onChange={handleChange}
                placeholder="Nhập điểm đến"
                required
                style={{
                  padding: 10,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label>Ngày khởi hành</label>
                  <input
                    type="date"
                    name="ngayKhoiHanh"
                    value={formData.ngayKhoiHanh}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid #ddd",
                      borderRadius: 8,
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label>Giờ khởi hành</label>
                  <input
                    type="time"
                    name="gioKhoiHanh"
                    value={formData.gioKhoiHanh}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid #ddd",
                      borderRadius: 8,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label>Giá vé (VNĐ)</label>
                  <input
                    type="number"
                    name="giaVe"
                    value={formData.giaVe}
                    onChange={(e) =>
                      setFormData({ ...formData, giaVe: Number(e.target.value) })
                    }
                    required
                    style={{  
                      width: "100%",
                      padding: 10,
                      border: "1px solid #ddd",
                      borderRadius: 8,
                    }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label>Số lượng ghế</label>
                  <input
                    type="number"
                    name="soLuongGhe"
                    value={formData.soLuongGhe}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        soLuongGhe: Number(e.target.value),
                      })
                    }
                    required
                    style={{
                      width: "100%",
                      padding: 10,
                      border: "1px solid #ddd",
                      borderRadius: 8,
                    }}
                  />
                </div>
              </div>

              <label>Trạng thái</label>
              <select
                name="trangThai"
                value={formData.trangThai}
                onChange={handleChange}
                style={{
                  padding: 10,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              >
                <option value="Hoạt động">Hoạt động</option>
                <option value="Tạm dừng">Tạm dừng</option>
              </select>

              <label>Ảnh chuyến xe</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  padding: 8,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                }}
              />

              {previewImage && (
                <img
                  src={previewImage}
                  alt="Preview"
                  style={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              )}

              <button
                type="submit"
                disabled={uploading}
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  padding: "10px 0",
                  border: "none",
                  borderRadius: 10,
                  marginTop: 10,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                {uploading
                  ? "Đang lưu..."
                  : editingTrip
                  ? "Cập nhật chuyến xe"
                  : "Thêm chuyến xe"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
