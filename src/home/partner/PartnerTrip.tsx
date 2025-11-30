import React, { useState, useEffect, useCallback } from "react";
import type { CSSProperties } from "react";
import { uploadToCloudinary } from "../../api/uploadToCloudinary";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaMapMarkerAlt,
  FaUsers,
  FaBuilding,
  FaMoneyBill,
  FaClock,
  FaCalendarAlt,
  FaCarSide,
  FaTicketAlt,
} from "react-icons/fa";
import {
  getAllTrips,
  createTrip,
  updateTrip,
  deleteTrip,
} from "../../api/tripApi";
import { getBookedSeats } from "../../api/bookingApi";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // 🔥 Dùng Firebase Auth

// ✅ MAPPING TÊN NHÀ XE
const NHA_XE_MAPPING: Record<string, string> = {
  "yft1Ag1eaRf3uCigXyCJLpmu9R42": "Phúc Yên",
  "SFbbzut0USTG5F6ZM3COrLXKGS93": "Cúc Tư",
  "BuPwvEMgfCNEDbz2VNKx5hnpBT52": "Hồng Sơn",
  "U5XWQ12kL8VnyQ0ovZTvUZLdJov1": "Nhật Tân"
};
const getNhaXeName = (id: string) => NHA_XE_MAPPING[id] || id;

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
  bookedSeats?: string[];
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
  const [authChecked, setAuthChecked] = useState(false);
  const [seatUsage, setSeatUsage] = useState<Record<string, number>>({});

  // ✅ Lấy user hiện tại từ Firebase Auth
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setPartnerId(user.uid);
      } else {
        setPartnerId("");
      }
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  // 🚌 Lấy danh sách chuyến xe theo partner
  useEffect(() => {
    if (!partnerId) {
      setTrips([]);
      setSeatUsage({});
      return;
    }
    fetchTrips(partnerId);
  }, [partnerId]);

  const fetchTrips = async (ownerId?: string) => {
    setLoading(true);
    try {
      if (!ownerId) {
        setTrips([]);
        return;
      }
      const data = await getAllTrips(ownerId);
      setTrips(data);
    } catch (error) {
      console.error("❌ Lỗi khi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeatUsage = useCallback(async (tripList: Trip[]) => {
    if (!tripList.length) {
      setSeatUsage({});
      return;
    }
    try {
      const entries = await Promise.all(
        tripList.map(async (trip) => {
          if (!trip._id) return ["", 0] as const;
          try {
            const booked = await getBookedSeats(trip._id);
            return [trip._id, booked.length] as const;
          } catch (err) {
            console.error("❌ Lỗi khi lấy ghế đã đặt:", err);
            return [trip._id, 0] as const;
          }
        })
      );
      const usageMap: Record<string, number> = {};
      entries.forEach(([id, count]) => {
        if (id) usageMap[id] = count;
      });
      setSeatUsage(usageMap);
    } catch (error) {
      console.error("❌ Lỗi khi tổng hợp ghế đã đặt:", error);
      setSeatUsage({});
    }
  }, []);

  useEffect(() => {
    if (trips.length) {
      fetchSeatUsage(trips);
    } else {
      setSeatUsage({});
    }
  }, [trips, fetchSeatUsage]);

  const handleOpenAddForm = () => {
    setEditingTrip(null);
    setFormData({
      tenChuyen: "",
      maTai: "",
      tu: "",
      den: "",
      giaVe: 0,
      soLuongGhe: 0,
      nhaXe: partnerId || "Nhà xe đối tác",
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
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg,#eff6ff,#fafbfd)",
      padding: "32px 40px",
      display: "flex",
      flexDirection: "column",
      gap: 24,
    },
    hero: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "linear-gradient(120deg,#1d4ed8,#60a5fa)",
      padding: "32px",
      borderRadius: 24,
      color: "#fff",
      boxShadow: "0 20px 35px rgba(37,99,235,0.25)",
    },
    heroLabel: {
      textTransform: "uppercase",
      letterSpacing: 3,
      fontSize: 12,
      fontWeight: 700,
      opacity: 0.8,
      margin: 0,
    },
    heroTitle: {
      fontSize: 32,
      margin: "8px 0",
      fontWeight: 800,
    },
    heroSubtitle: {
      maxWidth: 520,
      margin: 0,
      lineHeight: 1.5,
      opacity: 0.9,
    },
    primaryCta: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      background: "#fff",
      color: "#1d4ed8",
      border: "none",
      padding: "14px 24px",
      borderRadius: 16,
      fontWeight: 700,
      fontSize: 16,
      cursor: "pointer",
      boxShadow: "0 12px 30px rgba(255,255,255,0.25)",
    },
    metricsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: 16,
    },
    metricCard: {
      color: "#fff",
      padding: "18px 20px",
      borderRadius: 20,
      boxShadow: "0 10px 25px rgba(15,23,42,0.15)",
    },
    scrollArea: {
      flex: 1,
      overflowY: "auto",
      paddingBottom: 40,
    },
    emptyState: {
      marginTop: 24,
      padding: 24,
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 6px 16px rgba(15,23,42,0.08)",
      color: "#475569",
      textAlign: "center",
    },
    cardContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
      gap: 20,
    },
    tripCard: {
      background: "#fff",
      borderRadius: 28,
      padding: 20,
      boxShadow: "0 20px 45px rgba(37,99,235,0.15)",
      display: "flex",
      flexDirection: "column",
      gap: 16,
      border: "1px solid #e0ecff",
    },
    tripMedia: {
      position: "relative",
      overflow: "hidden",
      borderRadius: 20,
      height: 180,
      background: "linear-gradient(135deg,#dbeafe,#bfdbfe)",
    },
    tripImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    },
    imageFallback: {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#1d4ed8",
      fontSize: 64,
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    tripTag: {
      margin: 0,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: "#94a3b8",
    },
    tripTitle: {
      margin: "4px 0",
      fontSize: 22,
      fontWeight: 700,
      color: "#0f172a",
    },
    tripRoute: {
      margin: 0,
      color: "#475569",
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontWeight: 600,
    },
    statusPill: {
      padding: "6px 16px",
      borderRadius: 999,
      fontSize: 13,
      fontWeight: 700,
    },
    cardBody: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
    },
    cardInfoGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
      gap: 12,
    },
    infoBlock: {
      display: "flex",
      gap: 10,
      alignItems: "center",
      padding: "12px 14px",
      borderRadius: 16,
      background: "#f8fafc",
      color: "#0f172a",
      fontSize: 13,
    },
    badgeRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 10,
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 12px",
      borderRadius: 999,
      background: "#eef2ff",
      color: "#312e81",
      fontSize: 13,
      fontWeight: 600,
    },
    progressTrack: {
      marginTop: 6,
      height: 6,
      borderRadius: 999,
      background: "#e2e8f0",
      width: "100%",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 999,
      background: "linear-gradient(120deg,#2563eb,#7c3aed)",
      transition: "width 0.3s ease",
    },
    cardFooter: {
      display: "flex",
      gap: 12,
    },
    footerBtn: {
      flex: 1,
      borderRadius: 14,
      padding: "10px 0",
      border: "none",
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      cursor: "pointer",
    },
    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(15,23,42,0.55)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999,
      padding: 24,
    },
    modalContent: {
      width: "100%",
      maxWidth: 960,
      background: "#fff",
      borderRadius: 32,
      overflow: "hidden",
      boxShadow: "0 30px 60px rgba(15,23,42,0.25)",
      display: "flex",
      flexDirection: "column",
      maxHeight: "90vh",
    },
    formHeader: {
      background: "linear-gradient(120deg,#1d4ed8,#4338ca)",
      color: "#fff",
      padding: "24px 32px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    formLayout: {
      display: "flex",
      flexDirection: "column",
      height: "100%",
    },
    formBody: {
      padding: "24px 32px 32px",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 20,
      flex: 1,
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
      gap: 20,
    },
    sectionBox: {
      background: "#f8fafc",
      borderRadius: 20,
      padding: 18,
      border: "1px solid #e2e8f0",
      display: "flex",
      flexDirection: "column",
      gap: 12,
    },
    sectionTitle: {
      margin: 0,
      fontWeight: 700,
      color: "#1d4ed8",
      fontSize: 14,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      fontSize: 13,
      color: "#475569",
      fontWeight: 600,
    },
    input: {
      borderRadius: 12,
      border: "1px solid #dbeafe",
      padding: "10px 14px",
      fontSize: 14,
      fontFamily: "inherit",
      background: "#fff",
      color: "#0f172a",
    },
    twoColumn: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
      gap: 12,
    },
    previewImage: {
      width: "100%",
      height: 160,
      objectFit: "cover",
      borderRadius: 16,
      border: "1px solid #bfdbfe",
    },
    formFooter: {
      padding: "20px 32px",
      background: "#eff4ff",
      borderTop: "1px solid #dbeafe",
      display: "flex",
      gap: 16,
      boxShadow: "0 -10px 30px rgba(15,23,42,0.05)",
    },
    actionBtn: {
      flex: 1,
      borderRadius: 18,
      padding: "14px 0",
      fontSize: 16,
      fontWeight: 700,
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      transition: "transform 0.2s ease",
    },
    secondaryBtn: {
      background: "#e2e8f0",
      color: "#1e293b",
      border: "1px solid #cbd5f5",
    },
    primaryBtn: {
      background: "linear-gradient(120deg,#2563eb,#7c3aed)",
      color: "#fff",
      boxShadow: "0 15px 30px rgba(99,102,241,0.3)",
    },
  };

  const analytics = {
    totalTrips: trips.length,
    activeTrips: trips.filter((t) => t.trangThai === "Hoạt động").length,
    totalSeats: trips.reduce((sum, t) => sum + (t.soLuongGhe || 0), 0),
  };

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div>
          <p style={styles.heroLabel}>Bảng điều khiển nhà xe</p>
          <h1 style={styles.heroTitle}>Quản lý chuyến xe của bạn</h1>
          <p style={styles.heroSubtitle}>
            Theo dõi trạng thái, cập nhật thông tin và tạo chuyến mới chỉ với vài bước.
          </p>
        </div>
        <button style={styles.primaryCta} onClick={handleOpenAddForm}>
          <FaPlus /> Tạo chuyến mới
        </button>
      </div>

      <div style={styles.metricsGrid}>
        <div style={{ ...styles.metricCard, background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}>
          <p>Tổng số chuyến</p>
          <strong>{analytics.totalTrips}</strong>
        </div>
        <div style={{ ...styles.metricCard, background: "linear-gradient(135deg,#0ea5e9,#22d3ee)" }}>
          <p>Đang hoạt động</p>
          <strong>{analytics.activeTrips}</strong>
        </div>
        <div style={{ ...styles.metricCard, background: "linear-gradient(135deg,#10b981,#34d399)" }}>
          <p>Tổng số ghế</p>
          <strong>{analytics.totalSeats}</strong>
        </div>
      </div>

      <div style={styles.scrollArea}>
        {loading && <div>Đang tải dữ liệu...</div>}
        {authChecked && !partnerId ? (
          <div style={styles.emptyState}>Bạn cần đăng nhập bằng tài khoản nhà xe để xem và quản lý chuyến của mình.</div>
        ) : trips.length === 0 && !loading ? (
          <div style={styles.emptyState}>Chưa có chuyến xe nào. Hãy thêm chuyến đầu tiên!</div>
        ) : (
          <div style={styles.cardContainer}>
            {trips.map((trip) => {
              const fallbackCount = trip.bookedSeats?.length ?? 0;
              const bookedCount = trip._id ? seatUsage[trip._id] ?? fallbackCount : fallbackCount;
              const capacity = trip.soLuongGhe || 0;
              const occupancyPercent = capacity > 0 ? Math.min(100, Math.round((bookedCount / capacity) * 100)) : 0;

              return (
                <div key={trip._id} style={styles.tripCard}>
                <div style={styles.tripMedia}>
                  {trip.hinhAnh ? (
                    <img src={trip.hinhAnh} alt={trip.tenChuyen} style={styles.tripImage} />
                  ) : (
                    <div style={styles.imageFallback}>
                      <FaCarSide />
                    </div>
                  )}
                </div>
                <div style={styles.cardHeader}>
                  <div>
                    <p style={styles.tripTag}>#{trip.maTai || "MỚI"}</p>
                    <h3 style={styles.tripTitle}>{trip.tenChuyen}</h3>
                    <p style={styles.tripRoute}>
                      <FaMapMarkerAlt /> {trip.tu} → {trip.den}
                    </p>
                  </div>
                  <span
                    style={{
                      ...styles.statusPill,
                      background: trip.trangThai === "Hoạt động" ? "#dcfce7" : "#fee2e2",
                      color: trip.trangThai === "Hoạt động" ? "#166534" : "#991b1b",
                    }}
                  >
                    {trip.trangThai}
                  </span>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.cardInfoGrid}>
                    <div style={styles.infoBlock}>
                      <FaCalendarAlt color="#2563eb" />
                      <div>
                        <p>Ngày khởi hành</p>
                        <strong>{trip.ngayKhoiHanh || "Chưa cập nhật"}</strong>
                      </div>
                    </div>
                    <div style={styles.infoBlock}>
                      <FaClock color="#2563eb" />
                      <div>
                        <p>Giờ khởi hành</p>
                        <strong>{trip.gioKhoiHanh || "Chưa cập nhật"}</strong>
                      </div>
                    </div>
                    <div style={styles.infoBlock}>
                      <FaUsers color="#2563eb" />
                      <div>
                        <p>Số ghế</p>
                        <strong>{trip.soLuongGhe}</strong>
                      </div>
                    </div>
                    <div style={styles.infoBlock}>
                      <FaTicketAlt color="#2563eb" />
                      <div style={{ flex: 1 }}>
                        <p>Ghế đã đặt</p>
                        <strong>
                          {bookedCount}/{trip.soLuongGhe} ghế
                        </strong>
                        <div style={styles.progressTrack}>
                          <div style={{ ...styles.progressFill, width: `${occupancyPercent}%` }} />
                        </div>
                      </div>
                    </div>
                    <div style={styles.infoBlock}>
                      <FaMoneyBill color="#2563eb" />
                      <div>
                        <p>Giá vé</p>
                        <strong>{trip.giaVe.toLocaleString()}₫</strong>
                      </div>
                    </div>
                  </div>

                  <div style={styles.badgeRow}>
                    <span style={styles.badge}>
                      <FaCarSide color="#4338ca" /> {trip.loaiXe} • {trip.hangXe || "Chưa rõ"}
                    </span>
                    <span style={styles.badge}>
                      <FaBuilding color="#4338ca" /> {getNhaXeName(trip.nhaXe)}
                    </span>
                  </div>
                </div>

                <div style={styles.cardFooter}>
                  <button
                    style={{ ...styles.footerBtn, background: "#eef2ff", color: "#4338ca" }}
                    onClick={() => handleEditTrip(trip)}
                  >
                    <FaEdit /> Chỉnh sửa
                  </button>
                  <button
                    style={{ ...styles.footerBtn, background: "#fee2e2", color: "#b91c1c" }}
                    onClick={() => trip._id && handleDeleteTrip(trip._id)}
                  >
                    <FaTrash /> Xóa
                  </button>
                </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.formHeader}>
              <div>
                <p>Tác vụ hiện tại</p>
                <h2>{editingTrip ? "Cập nhật chuyến xe" : "Thêm chuyến xe mới"}</h2>
              </div>
              <FaTimes style={{ cursor: "pointer" }} onClick={() => setShowForm(false)} />
            </div>
            <form style={styles.formLayout} onSubmit={handleSubmit}>
              <div style={styles.formBody}>
                <div style={styles.formGrid}>
                <div style={styles.sectionBox}>
                  <p style={styles.sectionTitle}>Thông tin chung</p>
                  <label style={styles.field}>
                    <span>Tên chuyến *</span>
                    <input
                      style={styles.input}
                      name="tenChuyen"
                      value={formData.tenChuyen}
                      onChange={handleChange}
                      placeholder="VD: Sài Gòn - Hà Nội"
                      required
                    />
                  </label>
                  <div style={styles.twoColumn}>
                    <label style={styles.field}>
                      <span>Mã tài *</span>
                      <input
                        style={styles.input}
                        name="maTai"
                        value={formData.maTai}
                        onChange={handleChange}
                        placeholder="Nhập mã tài"
                        required
                      />
                    </label>
                    <label style={styles.field}>
                      <span>Trạng thái</span>
                      <select
                        style={styles.input}
                        name="trangThai"
                        value={formData.trangThai}
                        onChange={handleChange}
                      >
                        <option value="Hoạt động">Hoạt động</option>
                        <option value="Tạm dừng">Tạm dừng</option>
                      </select>
                    </label>
                  </div>
                  <label style={styles.field}>
                    <span>Ảnh chuyến xe</span>
                    <input style={styles.input} type="file" accept="image/*" onChange={handleImageChange} />
                  </label>
                  {previewImage && (
                    <img src={previewImage} alt="Preview" style={styles.previewImage} />
                  )}
                </div>

                <div style={styles.sectionBox}>
                  <p style={styles.sectionTitle}>Thông tin phương tiện</p>
                  <div style={styles.twoColumn}>
                    <label style={styles.field}>
                      <span>Loại xe</span>
                      <select style={styles.input} name="loaiXe" value={formData.loaiXe} onChange={handleChange}>
                        <option value="Giường nằm">Giường nằm</option>
                        <option value="Limousine giường nằm">Limousine giường nằm</option>
                        <option value="VIP giường nằm">VIP giường nằm</option>
                      </select>
                    </label>
                    <label style={styles.field}>
                      <span>Hãng xe</span>
                      <input style={styles.input} name="hangXe" value={formData.hangXe} onChange={handleChange} placeholder="VD: Thaco, Hyundai..." />
                    </label>
                  </div>
                  <label style={styles.field}>
                    <span>Màu sắc</span>
                    <input style={styles.input} name="mauSac" value={formData.mauSac} onChange={handleChange} placeholder="VD: Đỏ, trắng..." />
                  </label>
                </div>

                <div style={styles.sectionBox}>
                  <p style={styles.sectionTitle}>Lịch trình</p>
                  <div style={styles.twoColumn}>
                    <label style={styles.field}>
                      <span>Điểm đi *</span>
                      <input style={styles.input} name="tu" value={formData.tu} onChange={handleChange} placeholder="Nhập điểm đi" required />
                    </label>
                    <label style={styles.field}>
                      <span>Điểm đến *</span>
                      <input style={styles.input} name="den" value={formData.den} onChange={handleChange} placeholder="Nhập điểm đến" required />
                    </label>
                  </div>
                  <div style={styles.twoColumn}>
                    <label style={styles.field}>
                      <span>Ngày khởi hành</span>
                      <input style={styles.input} type="date" name="ngayKhoiHanh" value={formData.ngayKhoiHanh} onChange={handleChange} />
                    </label>
                    <label style={styles.field}>
                      <span>Giờ khởi hành</span>
                      <input style={styles.input} type="time" name="gioKhoiHanh" value={formData.gioKhoiHanh} onChange={handleChange} />
                    </label>
                  </div>
                </div>

                  <div style={styles.sectionBox}>
                    <p style={styles.sectionTitle}>Giá & Sức chứa</p>
                    <div style={styles.twoColumn}>
                      <label style={styles.field}>
                        <span>Giá vé (VNĐ)</span>
                        <input
                          style={styles.input}
                          type="number"
                          name="giaVe"
                          value={formData.giaVe}
                          onChange={(e) => setFormData({ ...formData, giaVe: Number(e.target.value) })}
                          required
                        />
                      </label>
                      <label style={styles.field}>
                        <span>Số lượng ghế</span>
                        <input
                          style={styles.input}
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
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.formFooter}>
                <button
                  type="button"
                  style={{ ...styles.actionBtn, ...styles.secondaryBtn }}
                  onClick={() => setShowForm(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  style={{ ...styles.actionBtn, ...styles.primaryBtn, opacity: uploading ? 0.7 : 1 }}
                >
                  {uploading ? "Đang lưu..." : editingTrip ? "Lưu chỉnh sửa" : "Thêm chuyến xe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
