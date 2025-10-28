import React, { useState, useEffect } from "react";
import type { CSSProperties } from "react";
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
} from "react-icons/fa";
import {
  getAllTrips,
  createTrip,
  updateTrip,
  deleteTrip,
} from "../../api/tripApi";

interface Trip {
  _id?: string;
  tenChuyen: string;
  tu: string;
  den: string;
  ngayKhoiHanh?: string;
  gioKhoiHanh?: string;
  giaVe: number;
  soLuongGhe: number;
  nhaXe: string;
  trangThai: string;
  hinhAnh?: string;
}

export default function PartnerTrip() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Trip>({
    tenChuyen: "",
    tu: "",
    den: "",
    giaVe: 0,
    soLuongGhe: 0,
    nhaXe: "",
    trangThai: "Hoạt động",
    ngayKhoiHanh: "",
    gioKhoiHanh: "",
  });
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 📦 Lấy danh sách chuyến xe
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

  // 🟢 Mở form thêm mới
  const handleOpenAddForm = () => {
    setEditingTrip(null);
    setFormData({
      tenChuyen: "",
      tu: "",
      den: "",
      giaVe: 0,
      soLuongGhe: 0,
      nhaXe: "",
      trangThai: "Hoạt động",
      ngayKhoiHanh: "",
      gioKhoiHanh: "",
    });
    setSelectedImage(null);
    setPreviewImage(null);
    setShowForm(true);
  };

  // 🟡 Chỉnh sửa chuyến
  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    setFormData(trip);
    setPreviewImage(trip.hinhAnh ? `http://localhost:5000${trip.hinhAnh}` : null);
    setShowForm(true);
  };

  // 🖼️ Chọn ảnh
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  // 💾 Lưu form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.entries(formData).forEach(
        ([key, value]) => value !== undefined && data.append(key, value as any)
      );
      if (selectedImage) data.append("hinhAnh", selectedImage);

      if (editingTrip?._id) await updateTrip(editingTrip._id, data, true);
      else await createTrip(data, true);

      setShowForm(false);
      fetchTrips();
    } catch (error) {
      console.error("❌ Lỗi khi lưu:", error);
    }
  };

  // ❌ Xóa chuyến
  const handleDeleteTrip = async (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa chuyến xe này không?")) {
      try {
        await deleteTrip(id);
        setTrips(trips.filter((t) => t._id !== id));
      } catch (error) {
        console.error("❌ Lỗi khi xóa:", error);
      }
    }
  };

  /* === CSS === */
  const styles: { [key: string]: CSSProperties } = {
    container: {
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(135deg, #e0f0ff 0%, #f9f5ff 100%)",
      fontFamily: "Arial, sans-serif",
    },
    header: {
      position: "sticky",
      top: 0,
      background: "linear-gradient(135deg, #e0f0ff 0%, #f9f5ff 100%)",
      zIndex: 10,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px",
      borderBottom: "1px solid #ddd",
    },
    title: { fontSize: "26px", fontWeight: 700, color: "#333" },
    subtitle: { fontSize: "14px", color: "#666" },
    button: {
      background: "linear-gradient(90deg, #2563eb, #9333ea)",
      color: "#fff",
      padding: "10px 20px",
      borderRadius: "12px",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontWeight: 600,
    },
    scrollArea: { flex: 1, overflowY: "auto", padding: "20px" },
    cardContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: "20px",
    },
    card: {
      background: "#fff",
      borderRadius: "16px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    },
    cardImage: {
      width: "100%",
      height: "160px",
      objectFit: "cover",
      background: "#f0f0f0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    cardContent: { padding: "16px", flex: 1 },
    cardTitle: {
      fontSize: "18px",
      fontWeight: 700,
      marginBottom: "10px",
      color: "#222",
    },
    infoRow: {
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "14px",
      marginBottom: "6px",
      color: "#555",
    },
    price: {
      fontSize: "20px",
      fontWeight: 700,
      color: "#2563eb",
      marginTop: "10px",
    },
    actions: { display: "flex", gap: "10px", marginTop: "12px" },
    actionBtn: {
      flex: 1,
      padding: "8px 0",
      borderRadius: "10px",
      fontWeight: 600,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      border: "none",
    },
    editBtn: { background: "#e0f0ff", color: "#2563eb" },
    deleteBtn: { background: "#ffe0e0", color: "#d23f3f" },
    modalOverlay: {
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
    },
    modal: {
      background: "#fff",
      borderRadius: "24px",
      width: "100%",
      maxWidth: "600px",
      maxHeight: "90vh",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    },
    modalHeader: {
      background: "linear-gradient(90deg,#2563eb,#9333ea)",
      padding: "16px",
      borderTopLeftRadius: "24px",
      borderTopRightRadius: "24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      color: "#fff",
      fontSize: "18px",
      fontWeight: 600,
    },
    formContainer: {
      padding: "16px",
      overflowY: "auto",
      flex: 1,
      maxHeight: "70vh",
    },
    formGroup: {
      marginBottom: "14px",
      display: "flex",
      flexDirection: "column",
    },
    input: {
      padding: "10px",
      borderRadius: "10px",
      border: "1px solid #ccc",
      fontSize: "14px",
    },
    select: {
      padding: "10px",
      borderRadius: "10px",
      border: "1px solid #ccc",
      fontSize: "14px",
    },
    imagePreview: {
      marginTop: "10px",
      width: "100%",
      height: "160px",
      objectFit: "cover",
      borderRadius: "12px",
    },
    modalActions: { display: "flex", gap: "10px", marginTop: "16px" },
    saveBtn: {
      flex: 1,
      background: "linear-gradient(90deg,#2563eb,#9333ea)",
      color: "#fff",
      padding: "10px",
      borderRadius: "10px",
      border: "none",
      fontWeight: 600,
      cursor: "pointer",
    },
    cancelBtn: {
      flex: 1,
      background: "#eee",
      color: "#333",
      padding: "10px",
      borderRadius: "10px",
      border: "none",
      fontWeight: 600,
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.title}>
            <FaBus style={{ marginRight: "8px" }} />
            Quản lý chuyến xe
          </div>
          <div style={styles.subtitle}>
            Theo dõi, thêm mới và chỉnh sửa thông tin các chuyến xe
          </div>
        </div>
        <button style={styles.button} onClick={handleOpenAddForm}>
          <FaPlus /> Thêm chuyến xe
        </button>
      </div>

      {/* Danh sách chuyến xe */}
      <div style={styles.scrollArea}>
        {loading && <div>Đang tải dữ liệu...</div>}

        <div style={styles.cardContainer}>
          {trips.map((trip) => (
            <div key={trip._id} style={styles.card}>
              <div style={styles.cardImage}>
                {trip.hinhAnh ? (
                  <img
                    src={`http://localhost:5000${trip.hinhAnh}`}
                    alt={trip.tenChuyen}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
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

      {/* 🟣 Modal Form */}
      {showForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              {editingTrip ? "Cập nhật chuyến xe" : "Thêm chuyến xe mới"}
              <FaTimes style={{ cursor: "pointer" }} onClick={() => setShowForm(false)} />
            </div>
            <form style={styles.formContainer} onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label>Tên chuyến</label>
                <input
                  style={styles.input}
                  name="tenChuyen"
                  value={formData.tenChuyen}
                  onChange={(e) =>
                    setFormData({ ...formData, tenChuyen: e.target.value })
                  }
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>Điểm đi</label>
                <input
                  style={styles.input}
                  name="tu"
                  value={formData.tu}
                  onChange={(e) =>
                    setFormData({ ...formData, tu: e.target.value })
                  }
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>Điểm đến</label>
                <input
                  style={styles.input}
                  name="den"
                  value={formData.den}
                  onChange={(e) =>
                    setFormData({ ...formData, den: e.target.value })
                  }
                  required
                />
              </div>

              {/* 🕓 Thêm ngày khởi hành */}
              <div style={styles.formGroup}>
                <label>Ngày khởi hành</label>
                <input
                  type="date"
                  style={styles.input}
                  name="ngayKhoiHanh"
                  value={formData.ngayKhoiHanh || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, ngayKhoiHanh: e.target.value })
                  }
                  required
                />
              </div>

              {/* ⏰ Thêm giờ khởi hành */}
              <div style={styles.formGroup}>
                <label>Giờ khởi hành</label>
                <input
                  type="time"
                  style={styles.input}
                  name="gioKhoiHanh"
                  value={formData.gioKhoiHanh || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, gioKhoiHanh: e.target.value })
                  }
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>Giá vé</label>
                <input
                  type="number"
                  style={styles.input}
                  name="giaVe"
                  value={formData.giaVe}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      giaVe: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>Số lượng ghế</label>
                <input
                  type="number"
                  style={styles.input}
                  name="soLuongGhe"
                  value={formData.soLuongGhe}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      soLuongGhe: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>Nhà xe</label>
                <input
                  style={styles.input}
                  name="nhaXe"
                  value={formData.nhaXe}
                  onChange={(e) =>
                    setFormData({ ...formData, nhaXe: e.target.value })
                  }
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label>Trạng thái</label>
                <select
                  style={styles.select}
                  name="trangThai"
                  value={formData.trangThai}
                  onChange={(e) =>
                    setFormData({ ...formData, trangThai: e.target.value })
                  }
                >
                  <option>Hoạt động</option>
                  <option>Tạm dừng</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label>Ảnh chuyến xe</label>
                <input type="file" accept="image/*" onChange={handleImageChange} />
                {previewImage && (
                  <img src={previewImage} alt="Preview" style={styles.imagePreview} />
                )}
              </div>

              <div style={styles.modalActions}>
                <button type="submit" style={styles.saveBtn}>
                  {editingTrip ? "Cập nhật" : "Thêm mới"}
                </button>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowForm(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
