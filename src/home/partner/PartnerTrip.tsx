import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  FaBed,
  FaChair,
  FaFilter,
  FaSearch,
  FaStar,
  FaChartLine,
  FaRocket,
  FaHashtag,
  FaPalette,
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
  bienSo?: string;
  tienIch?: string;
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

type FormVariant = "giuong" | "ghe" | null;

export default function PartnerTrip() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formVariant, setFormVariant] = useState<FormVariant>(null);
  const [formData, setFormData] = useState<Trip>({
    tenChuyen: "",
    maTai: "",
    bienSo: "",
    tienIch: "",
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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const partnerCarrierName = useMemo(
    () => (partnerId ? getNhaXeName(partnerId) : ""),
    [partnerId]
  );

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

  const resetFormState = (variant: FormVariant) => {
    const isGiuong = variant === "giuong";
    setEditingTrip(null);
    setFormData({
      tenChuyen: partnerCarrierName || "",
      maTai: "",
      tu: "",
      den: "",
      giaVe: 0,
      soLuongGhe: 0,
      nhaXe: partnerCarrierName || "Nhà xe đối tác",
      trangThai: "Hoạt động",
      ngayKhoiHanh: "",
      gioKhoiHanh: "",
      loaiXe: isGiuong ? "Giường nằm" : "Ghế ngồi",
      hangXe: "",
      mauSac: "",
    });
    setSelectedImage(null);
    setPreviewImage(null);
  };

  const handleOpenAddForm = () => {
    resetFormState("giuong");
    setFormVariant(null);
    setShowForm(true);
  };

  const handleEditTrip = (trip: Trip) => {
    setEditingTrip(trip);
    const variant: FormVariant = trip.loaiXe?.toLowerCase().includes("ghế") ? "ghe" : "giuong";
    setFormVariant(variant);
    setFormData({
      ...trip,
      tenChuyen: trip.tenChuyen || partnerCarrierName || "",
      nhaXe: trip.nhaXe || partnerCarrierName || "Nhà xe đối tác",
    });
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
    if (name === "tenChuyen" || name === "nhaXe") {
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    if (!showForm) return;
    if (!partnerCarrierName) return;
    setFormData((prev) => {
      const resolvedName = partnerCarrierName || prev.tenChuyen;
      if (prev.tenChuyen === resolvedName && prev.nhaXe === resolvedName) {
        return prev;
      }
      return {
        ...prev,
        tenChuyen: resolvedName,
        nhaXe: resolvedName,
      };
    });
  }, [partnerCarrierName, showForm]);

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
        tenChuyen: partnerCarrierName || formData.tenChuyen,
        nhaXe: partnerCarrierName || formData.nhaXe,
        hinhAnh: imageUrl ?? formData.hinhAnh,
        partnerId, // vẫn giữ partnerId để tham chiếu riêng
      };

      if (editingTrip) {
        // Backend khóa tên/nhaXe/partnerId nên không gửi lại các trường này khi cập nhật
        const { tenChuyen: _skipName, nhaXe: _skipCarrier, partnerId: _skipOwner, ...updatableFields } = tripData;
        const sanitizedPayload = Object.fromEntries(
          Object.entries(updatableFields).filter(([, value]) => value !== undefined)
        ) as Partial<Trip>;

        const updatedTrip = await updateTrip(editingTrip._id!, sanitizedPayload);
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
      setFormVariant(null);
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

  const handleVariantSelect = (variant: Exclude<FormVariant, null>) => {
    resetFormState(variant);
    setFormVariant(variant);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormVariant(null);
    setEditingTrip(null);
  };

  const palette = {
    background: "#f4f6ff",
    surface: "#ffffff",
    card: "#ffffff",
    border: "#e3e8ff",
    borderSoft: "#f2f4ff",
    text: "#0f172a",
    textMuted: "#4b5563",
    textSubtle: "#9ca3af",
    accent: "#4338ca",
    accentSoft: "#6366f1",
    accentSoftBg: "#eef2ff",
    badgeBg: "#f7f8ff",
  };

  const styles: Record<string, CSSProperties> = {
    container: {
      minHeight: "100vh",
      padding: "32px 24px 48px",
      background: "linear-gradient(180deg,#f7f8ff 0%,#f2f4ff 60%,#ffffff 100%)",
      color: palette.text,
      fontFamily: "'Inter', sans-serif",
      display: "flex",
      justifyContent: "center",
    },
    backgroundLayer: { display: "none" },
    glowOne: { display: "none" },
    glowTwo: { display: "none" },
    gridOverlay: { display: "none" },
    contentShell: {
      width: "100%",
      maxWidth: "1120px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
    },
    hero: {
      display: "flex",
      flexWrap: "wrap",
      gap: "30px",
      justifyContent: "space-between",
      background: palette.surface,
      border: `1px solid ${palette.borderSoft}`,
      borderRadius: "32px",
      padding: "32px",
      boxShadow: "0 25px 60px rgba(83,94,182,0.12)",
    },
    heroLabel: {
      textTransform: "uppercase",
      letterSpacing: "1.2px",
      fontSize: "12px",
      color: palette.textSubtle,
      margin: 0,
      fontWeight: 600,
    },
    heroTitle: {
      fontSize: "34px",
      margin: "10px 0 6px",
      color: palette.text,
      fontWeight: 700,
    },
    heroSubtitle: {
      maxWidth: "520px",
      margin: 0,
      lineHeight: 1.6,
      color: palette.textMuted,
      fontSize: "15px",
    },
    heroCtas: {
      display: "flex",
      flexWrap: "wrap",
      gap: "14px",
      marginTop: "26px",
    },
    primaryCta: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "13px 26px",
      borderRadius: "999px",
      border: "none",
      background: `linear-gradient(130deg,${palette.accentSoft},#7c3aed)`,
      color: "#ffffff",
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: "0 18px 32px rgba(99,102,241,0.35)",
    },
    secondaryCta: {
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "13px 24px",
      borderRadius: "999px",
      border: `1px solid ${palette.border}`,
      background: palette.surface,
      color: palette.text,
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: "0 12px 20px rgba(15,23,42,0.08)",
    },
    heroStats: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
      gap: "14px",
      flex: 1,
      minWidth: "280px",
    },
    heroStatCard: {
      background: "linear-gradient(135deg,#fdfdff 0%,#f3f4ff 100%)",
      borderRadius: "20px",
      border: `1px solid ${palette.borderSoft}`,
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      boxShadow: "0 14px 26px rgba(99,102,241,0.12)",
      minHeight: "120px",
    },
    heroStatIcon: {
      width: "40px",
      height: "40px",
      borderRadius: "14px",
      background: palette.accentSoftBg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: palette.accentSoft,
      border: `1px solid ${palette.borderSoft}`,
    },
    heroStatLabel: {
      margin: 0,
      fontSize: "12px",
      letterSpacing: "0.6px",
      color: palette.textSubtle,
      textTransform: "uppercase",
    },
    heroStatValue: {
      margin: 0,
      fontSize: "28px",
      fontWeight: 700,
      color: palette.text,
    },
    metricsSection: {
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    metricsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: "14px",
    },
    metricCard: {
      background: palette.card,
      borderRadius: "22px",
      border: `1px solid ${palette.borderSoft}`,
      padding: "18px",
      color: palette.text,
      boxShadow: "0 12px 28px rgba(15,23,42,0.06)",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    metricAccent: {
      width: "42px",
      height: "42px",
      borderRadius: "14px",
      background: palette.accentSoftBg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: palette.accentSoft,
      marginBottom: "8px",
    },
    metricTitle: {
      margin: 0,
      fontSize: "13px",
      letterSpacing: "0.6px",
      textTransform: "uppercase",
      color: palette.textSubtle,
    },
    metricValue: {
      margin: "4px 0",
      fontSize: "26px",
      fontWeight: 700,
    },
    metricSubtext: {
      margin: 0,
      fontSize: "12px",
      color: palette.textSubtle,
    },
    scrollArea: {
      flex: 1,
      overflowY: "auto",
      padding: "26px",
      background: palette.card,
      borderRadius: "28px",
      border: `1px solid ${palette.borderSoft}`,
      boxShadow: "0 28px 64px rgba(71,78,120,0.09)",
    },
    toolbar: {
      display: "flex",
      flexWrap: "wrap",
      gap: "18px",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: "20px",
    },
    filterGroup: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
    },
    filterButton: {
      borderRadius: "999px",
      border: `1px solid ${palette.border}`,
      background: palette.card,
      color: palette.text,
      padding: "7px 16px",
      fontWeight: 600,
      cursor: "pointer",
      boxShadow: "0 8px 20px rgba(15,23,42,0.05)",
    },
    filterButtonActive: {
      background: palette.accentSoft,
      color: "#ffffff",
      borderColor: palette.accentSoft,
      boxShadow: "0 12px 26px rgba(99,102,241,0.35)",
    },
    filterHint: {
      color: palette.textSubtle,
      fontSize: "12px",
    },
    searchControl: {
      flex: 1,
      minWidth: "240px",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      borderRadius: "12px",
      padding: "10px 14px",
      border: `1px solid ${palette.border}`,
      background: palette.card,
    },
    searchIcon: {
      color: palette.textSubtle,
      fontSize: "16px",
    },
    searchInput: {
      flex: 1,
      border: "none",
      background: "transparent",
      color: palette.text,
      fontSize: "14px",
      outline: "none",
    },
    emptyState: {
      marginTop: "16px",
      padding: "32px",
      background: palette.card,
      borderRadius: "22px",
      border: `1px dashed ${palette.borderSoft}`,
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      boxShadow: "0 18px 32px rgba(15,23,42,0.05)",
    },
    emptyStateTitle: {
      margin: 0,
      fontSize: "20px",
      fontWeight: 600,
    },
    emptyStateText: {
      margin: 0,
      color: palette.textMuted,
    },
    emptyStateAction: {
      marginTop: "12px",
      alignSelf: "center",
      padding: "10px 24px",
      borderRadius: "999px",
      border: "none",
      background: `linear-gradient(120deg,${palette.accentSoft},#0b1220)`,
      color: "#ffffff",
      cursor: "pointer",
      fontWeight: 600,
      boxShadow: "0 15px 30px rgba(76,110,245,0.35)",
    },
    cardContainer: {
      display: "flex",
      flexDirection: "column",
      gap: "18px",
      width: "100%",
    },
    tripCard: {
      background: palette.card,
      borderRadius: "26px",
      border: `1px solid ${palette.borderSoft}`,
      display: "flex",
      gap: "20px",
      padding: "20px 26px",
      alignItems: "stretch",
      flexWrap: "nowrap",
      width: "100%",
      minWidth: "680px",
      boxShadow: "0 32px 68px rgba(15,23,42,0.08)",
      overflowX: "auto",
    },
    tripMedia: {
      position: "relative",
      width: "200px",
      height: "150px",
      overflow: "hidden",
      borderRadius: "20px",
      flexShrink: 0,
      border: `1px solid ${palette.borderSoft}`,
    },
    tripImage: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
    },
    mediaOverlay: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0))",
    },
    imageFallback: {
      width: "100%",
      height: "100%",
      background: palette.surface,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: palette.textSubtle,
      fontSize: "28px",
    },
    tripDetails: {
      flex: 1,
      minWidth: "360px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
    },
    tripInfoRow: {
      display: "flex",
      justifyContent: "space-between",
      gap: "12px",
      alignItems: "flex-start",
    },
    tripTag: {
      margin: 0,
      color: palette.textSubtle,
      fontSize: "13px",
    },
    tripTitle: {
      margin: "6px 0 4px",
      fontSize: "22px",
      color: palette.text,
      fontWeight: 600,
    },
    tripRoute: {
      margin: 0,
      color: palette.textMuted,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "15px",
      fontWeight: 500,
    },
    tripDuration: {
      margin: "4px 0 0",
      color: palette.textSubtle,
      fontSize: "13px",
    },
    tripMetaRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
      gap: "10px",
      marginTop: "4px",
    },
    tripMetaItem: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "12px",
      borderRadius: "16px",
      border: `1px solid ${palette.borderSoft}`,
      background: palette.badgeBg,
    },
    tripMetaLabel: {
      margin: 0,
      fontSize: "11px",
      color: palette.textSubtle,
      textTransform: "uppercase",
      letterSpacing: "0.6px",
    },
    tripMetaValue: {
      margin: 0,
      fontSize: "15px",
      fontWeight: 600,
      color: palette.text,
    },
    tripStatsRow: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    tripStatsLabel: {
      margin: 0,
      fontSize: "13px",
      color: palette.textMuted,
      fontWeight: 500,
    },
    tripStatusChip: {
      position: "absolute",
      top: "12px",
      left: "12px",
      padding: "6px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: 600,
      border: `1px solid ${palette.borderSoft}`,
      boxShadow: "0 12px 22px rgba(15,23,42,0.15)",
      background: "rgba(255,255,255,0.9)",
    },
    progressTrack: {
      width: "100%",
      height: "6px",
      background: palette.borderSoft,
      borderRadius: "999px",
      marginTop: "6px",
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      background: `linear-gradient(90deg,${palette.accentSoft},#111827)`,
      borderRadius: "999px",
    },
    badgeRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px",
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      background: palette.badgeBg,
      color: palette.text,
      borderRadius: "999px",
      padding: "4px 10px",
      fontSize: "12px",
      border: `1px solid ${palette.borderSoft}`,
    },
    tripActions: {
      width: "220px",
      minWidth: "220px",
      borderLeft: `1px solid ${palette.borderSoft}`,
      paddingLeft: "18px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      justifyContent: "space-between",
      flexShrink: 0,
    },
    priceLabel: {
      margin: 0,
      fontSize: "12px",
      color: palette.textSubtle,
      textTransform: "uppercase",
      letterSpacing: "0.6px",
    },
    priceValue: {
      margin: 0,
      fontSize: "24px",
      fontWeight: 700,
      color: palette.accent,
    },
    seatNote: {
      margin: 0,
      fontSize: "13px",
      color: palette.textMuted,
    },
    actionButtons: {
      display: "grid",
      gridTemplateColumns: "1fr",
      gap: "8px",
    },
    footerBtn: {
      borderRadius: "999px",
      padding: "9px",
      fontWeight: 600,
      cursor: "pointer",
      border: `1px solid ${palette.borderSoft}`,
      background: palette.card,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "6px",
      width: "100%",
      boxShadow: "0 6px 12px rgba(15,23,42,0.06)",
    },
    modalOverlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(249,250,251,0.9)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
      padding: "20px",
    },
    modalContent: {
      width: "100%",
      maxWidth: "960px",
      background: palette.card,
      borderRadius: "24px",
      border: `1px solid ${palette.border}`,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      maxHeight: "90vh",
    },
    formHeader: {
      padding: "20px 28px",
      borderBottom: `1px solid ${palette.border}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: palette.card,
    },
    formHeaderLabel: {
      margin: 0,
      color: palette.textSubtle,
      fontSize: "12px",
      textTransform: "uppercase",
      letterSpacing: "1px",
    },
    formHeaderTitle: {
      margin: "6px 0 0",
      fontSize: "22px",
      color: palette.text,
    },
    formLayout: {
      display: "flex",
      flexDirection: "column",
      height: "100%",
    },
    formBody: {
      padding: "20px 28px",
      overflowY: "auto",
      maxHeight: "60vh",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    variantScrollArea: {
      maxHeight: "60vh",
      overflowY: "auto",
      paddingRight: "4px",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
      gap: "16px",
    },
    sectionBox: {
      background: palette.card,
      borderRadius: "18px",
      padding: "18px",
      border: `1px solid ${palette.borderSoft}`,
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      boxShadow: "0 10px 24px rgba(17,24,39,0.04)",
    },
    sectionTitle: {
      margin: 0,
      fontWeight: 600,
      color: palette.textMuted,
      fontSize: "13px",
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    },
    seatMapContainer: {
      marginTop: "4px",
      padding: "14px",
      background: palette.accentSoftBg,
      borderRadius: "18px",
      border: `1px solid ${palette.borderSoft}`,
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    },
    seatMapHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: "12px",
      flexWrap: "wrap",
    },
    seatMapTitleRow: {
      display: "flex",
      gap: "10px",
      alignItems: "center",
    },
    seatIconBadge: {
      width: "42px",
      height: "42px",
      borderRadius: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "18px",
      border: `1px solid ${palette.borderSoft}`,
      background: palette.card,
      boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
    },
    seatMapTitle: {
      margin: 0,
      fontWeight: 600,
      color: palette.text,
      fontSize: "15px",
    },
    seatLegend: {
      margin: 0,
      fontSize: "12px",
      color: palette.textMuted,
    },
    seatLegendRow: {
      display: "flex",
      gap: "8px",
      flexWrap: "wrap",
      alignItems: "center",
    },
    seatLegendChip: {
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "4px 10px",
      borderRadius: "999px",
      background: palette.card,
      border: `1px solid ${palette.border}`,
      fontSize: "12px",
      color: palette.text,
      fontWeight: 500,
    },
    legendDot: {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      display: "inline-block",
      background: palette.text,
    },
    seatMapGrid: {
      display: "grid",
      gap: "8px",
      width: "100%",
    },
    seatBox: {
      borderRadius: "10px",
      padding: "10px 0",
      textAlign: "center",
      fontWeight: 600,
      border: `1px solid ${palette.border}`,
      background: palette.card,
    },
    seatNumber: {
      fontSize: "13px",
      letterSpacing: "0.5px",
      color: palette.text,
    },
    seatCarCluster: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "4px",
    },
    seatCarIcon: {
      fontSize: "18px",
      color: palette.textSubtle,
    },
    floorSection: {
      display: "flex",
      flexDirection: "column",
      gap: "10px",
      background: palette.card,
      padding: "14px",
      borderRadius: "14px",
      border: `1px solid ${palette.border}`,
    },
    floorHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: "12px",
      color: palette.textMuted,
      fontWeight: 600,
    },
    seatRows: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    seatRow: {
      display: "grid",
      gridTemplateColumns: "repeat(2, minmax(50px, 1fr)) 60px repeat(2, minmax(50px, 1fr))",
      alignItems: "center",
      gap: "6px",
    },
    seatGroup: {
      display: "flex",
      gap: "6px",
      justifyContent: "center",
    },
    walkway: {
      textAlign: "center",
      fontSize: "11px",
      color: palette.textSubtle,
      letterSpacing: "0.6px",
    },
    field: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      fontSize: "12px",
      color: palette.textMuted,
      fontWeight: 600,
    },
    input: {
      borderRadius: "10px",
      border: `1px solid ${palette.border}`,
      padding: "10px 12px",
      fontSize: "14px",
      fontFamily: "inherit",
      background: palette.card,
      color: palette.text,
    },
    twoColumn: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
      gap: "10px",
    },
    previewImage: {
      width: "100%",
      height: "150px",
      objectFit: "cover",
      borderRadius: "12px",
      border: `1px solid ${palette.border}`,
    },
    formFooter: {
      padding: "18px 28px",
      background: palette.card,
      borderTop: `1px solid ${palette.border}`,
      display: "flex",
      gap: "12px",
    },
    actionBtn: {
      flex: 1,
      borderRadius: "999px",
      padding: "12px 0",
      fontSize: "15px",
      fontWeight: 600,
      border: `1px solid ${palette.borderSoft}`,
      cursor: "pointer",
      background: palette.card,
      color: palette.text,
      boxShadow: "0 12px 24px rgba(15,23,42,0.08)",
    },
    secondaryBtn: {
      background: palette.surface,
    },
    primaryBtn: {
      background: `linear-gradient(120deg,${palette.accentSoft},#0f172a)`,
      color: "#ffffff",
      borderColor: palette.accent,
    },
    variantPanel: {
      padding: "28px",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      background: palette.card,
    },
    variantPrompt: {
      margin: 0,
      color: palette.text,
      fontWeight: 600,
      fontSize: "16px",
    },
    variantGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
      gap: "12px",
    },
    variantCard: {
      borderRadius: "16px",
      padding: "22px",
      border: `1px solid ${palette.borderSoft}`,
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      fontSize: "15px",
      fontWeight: 600,
      cursor: "pointer",
      background: palette.card,
      textAlign: "left",
      color: palette.text,
      boxShadow: "0 15px 30px rgba(16,24,40,0.06)",
    },
  };

  const filteredTrips = useMemo(() => {
    let base = trips;
    if (statusFilter === "active") {
      base = trips.filter((t) => t.trangThai === "Hoạt động");
    } else if (statusFilter === "paused") {
      base = trips.filter((t) => t.trangThai !== "Hoạt động");
    }

    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return base;
    }

    return base.filter((trip) => {
      const text = `${trip.tenChuyen ?? ""} ${trip.tu ?? ""} ${trip.den ?? ""} ${trip.maTai ?? ""}`.toLowerCase();
      return text.includes(keyword);
    });
  }, [trips, statusFilter, searchTerm]);

  const analytics = useMemo(() => {
    if (!trips.length) {
      return { totalTrips: 0, activeTrips: 0, totalSeats: 0, averageOccupancy: 0 };
    }

    const totalTrips = trips.length;
    const activeTrips = trips.filter((t) => t.trangThai === "Hoạt động").length;
    const totalSeats = trips.reduce((sum, t) => sum + (t.soLuongGhe || 0), 0);

    const occupancySum = trips.reduce((sum, trip) => {
      if (!trip.soLuongGhe) return sum;
      const fallback = trip.bookedSeats?.length ?? 0;
      const booked = trip._id ? seatUsage[trip._id] ?? fallback : fallback;
      return sum + Math.min(1, booked / trip.soLuongGhe);
    }, 0);

    return {
      totalTrips,
      activeTrips,
      totalSeats,
      averageOccupancy: Math.round((occupancySum / totalTrips) * 100),
    };
  }, [trips, seatUsage]);

  const isFiltered = statusFilter !== "all" || Boolean(searchTerm.trim());
  const emptyCopy = isFiltered
    ? "Không tìm thấy chuyến phù hợp với bộ lọc hiện tại."
    : "Chưa có chuyến xe nào. Hãy thêm chuyến đầu tiên!";
  const filteredSeatCount = useMemo(
    () => filteredTrips.reduce((sum, trip) => sum + (trip.soLuongGhe || 0), 0),
    [filteredTrips]
  );
  const filterLabel =
    statusFilter === "all" ? "Tất cả trạng thái" : statusFilter === "active" ? "Đang hoạt động" : "Tạm dừng";

  const chunkArray = <T,>(items: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      chunks.push(items.slice(i, i + size));
    }
    return chunks;
  };

  const renderSeatMap = (variant: FormVariant) => {
    const seatCount = Number(formData.soLuongGhe) || 0;
    if (!variant || seatCount <= 0) return null;

    const config =
      variant === "giuong"
        ? {
            title: "Sơ đồ giường nằm 2 tầng",
            subtitle: "Hai dãy giường song song, lối đi giữa",
            iconBg: palette.surface,
            iconColor: palette.text,
            seatBg: palette.card,
            seatBorder: palette.border,
            seatColor: palette.text,
            legend: [
              { label: "Giường còn trống", color: palette.text },
              { label: "Lối đi", color: "#d1d5db" },
            ],
            icon: <FaBed />,
          }
        : {
            title: "Sơ đồ ghế ngồi 2+2",
            subtitle: "Hai ghế mỗi bên, lối đi trung tâm",
            iconBg: palette.surface,
            iconColor: palette.text,
            seatBg: palette.card,
            seatBorder: palette.border,
            seatColor: palette.text,
            legend: [
              { label: "Ghế còn trống", color: palette.text },
              { label: "Lối đi", color: "#d1d5db" },
            ],
            icon: <FaChair />,
          };

    const seatBoxStyle = {
      ...styles.seatBox,
      background: config.seatBg,
      borderColor: config.seatBorder,
      color: config.seatColor,
    } as CSSProperties;

    const seats = Array.from({ length: seatCount }, (_, idx) => idx + 1);
    const renderSeatBox = (seat: number) => (
      <div key={`${variant}-seat-${seat}`} style={seatBoxStyle}>
        {variant === "ghe" ? (
          <div style={styles.seatCarCluster}>
            <FaCarSide style={{ ...styles.seatCarIcon, color: config.seatColor }} />
            <span style={{ ...styles.seatNumber, color: config.seatColor }}>{seat}</span>
          </div>
        ) : (
          <span style={styles.seatNumber}>{seat}</span>
        )}
      </div>
    );

    if (variant === "giuong") {
      const perFloor = Math.ceil(seatCount / 2);
      const floors = [0, 1]
        .map((floorIndex) => ({
          label: `Tầng ${floorIndex + 1}`,
          seats: seats.slice(floorIndex * perFloor, (floorIndex + 1) * perFloor),
        }))
        .filter((floor) => floor.seats.length);

      return (
        <div style={styles.seatMapContainer}>
          <div style={styles.seatMapHeader}>
            <div style={styles.seatMapTitleRow}>
              <div
                style={{
                  ...styles.seatIconBadge,
                  background: config.iconBg,
                  color: config.iconColor,
                }}
              >
                {config.icon}
              </div>
              <div>
                <p style={styles.seatMapTitle}>{config.title}</p>
                <p style={styles.seatLegend}>{config.subtitle}</p>
              </div>
            </div>
            <div style={styles.seatLegendRow}>
              {config.legend.map((item) => (
                <span key={item.label} style={styles.seatLegendChip}>
                  <span style={{ ...styles.legendDot, background: item.color }} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          {floors.map((floor) => {
            const rows = chunkArray(floor.seats, 4);
            return (
              <div key={floor.label} style={styles.floorSection}>
                <div style={styles.floorHeader}>
                  <span>{floor.label}</span>
                  <span>{floor.seats.length} giường</span>
                </div>
                <div style={styles.seatRows}>
                  {rows.map((row, idx) => {
                    const left = row.slice(0, 2);
                    const right = row.slice(2);
                    return (
                      <div key={`${floor.label}-row-${idx}`} style={styles.seatRow}>
                        <div style={styles.seatGroup}>{left.map(renderSeatBox)}</div>
                        <div style={styles.walkway}>Lối đi</div>
                        <div style={styles.seatGroup}>{right.map(renderSeatBox)}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    const rows = chunkArray(seats, 4);
    return (
      <div style={styles.seatMapContainer}>
        <div style={styles.seatMapHeader}>
          <div style={styles.seatMapTitleRow}>
            <div
              style={{
                ...styles.seatIconBadge,
                background: config.iconBg,
                color: config.iconColor,
              }}
            >
              {config.icon}
            </div>
            <div>
              <p style={styles.seatMapTitle}>{config.title}</p>
              <p style={styles.seatLegend}>{config.subtitle}</p>
            </div>
          </div>
          <div style={styles.seatLegendRow}>
            {config.legend.map((item) => (
              <span key={item.label} style={styles.seatLegendChip}>
                <span style={{ ...styles.legendDot, background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
        <div style={styles.seatRows}>
          {rows.map((row, idx) => {
            const left = row.slice(0, 2);
            const right = row.slice(2);
            return (
              <div key={`floor-1-row-${idx}`} style={styles.seatRow}>
                <div style={styles.seatGroup}>{left.map(renderSeatBox)}</div>
                <div style={styles.walkway}>Lối đi</div>
                <div style={styles.seatGroup}>{right.map(renderSeatBox)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGiUongForm = () => (
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
            readOnly
            placeholder="VD: Sài Gòn - Hà Nội"
            required
          />
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            Tên chuyến được hệ thống khóa theo tài khoản nhà xe.
          </span>
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
            <select style={styles.input} name="trangThai" value={formData.trangThai} onChange={handleChange}>
              <option value="Hoạt động">Hoạt động</option>
              <option value="Tạm dừng">Tạm dừng</option>
            </select>
          </label>
        </div>
        <label style={styles.field}>
          <span>Ảnh chuyến xe</span>
          <input style={styles.input} type="file" accept="image/*" onChange={handleImageChange} />
        </label>
        {previewImage && <img src={previewImage} alt="Preview" style={styles.previewImage} />}
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
            <input
              style={styles.input}
              name="hangXe"
              value={formData.hangXe}
              onChange={handleChange}
              placeholder="VD: Thaco, Hyundai..."
            />
          </label>
        </div>
        <div style={styles.twoColumn}>
          <label style={styles.field}>
            <span>Biển số</span>
            <input
              style={styles.input}
              name="bienSo"
              value={formData.bienSo || ""}
              onChange={handleChange}
              placeholder="VD: 51B-123.45"
            />
          </label>
          <label style={styles.field}>
            <span>Màu sắc</span>
            <input
              style={styles.input}
              name="mauSac"
              value={formData.mauSac}
              onChange={handleChange}
              placeholder="VD: Đỏ, trắng..."
            />
          </label>
        </div>
        <label style={styles.field}>
          <span>Tiện ích (phân cách bằng dấu phẩy)</span>
          <input
            style={styles.input}
            name="tienIch"
            value={formData.tienIch || ""}
            onChange={handleChange}
            placeholder="VD: Wifi, Nước uống, Chăn đắp..."
          />
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
        {renderSeatMap("giuong")}
      </div>
    </div>
  );

  const renderGheForm = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={styles.sectionBox}>
        <p style={styles.sectionTitle}>Chuyến ghế ngồi</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
          <label style={styles.field}>
            <span>Tên chuyến *</span>
            <input style={styles.input} name="tenChuyen" value={formData.tenChuyen} readOnly />
          </label>
          <label style={styles.field}>
            <span>Mã tài *</span>
            <input style={styles.input} name="maTai" value={formData.maTai} onChange={handleChange} required />
          </label>
          <label style={styles.field}>
            <span>Loại xe</span>
            <select style={styles.input} name="loaiXe" value={formData.loaiXe} onChange={handleChange}>
              <option value="Ghế ngồi">Ghế ngồi tiêu chuẩn</option>
              <option value="Ghế ngồi VIP">Ghế ngồi VIP</option>
            </select>
          </label>
          <label style={styles.field}>
            <span>Trạng thái</span>
            <select style={styles.input} name="trangThai" value={formData.trangThai} onChange={handleChange}>
              <option value="Hoạt động">Hoạt động</option>
              <option value="Tạm dừng">Tạm dừng</option>
            </select>
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <label style={styles.field}>
            <span>Ảnh minh họa</span>
            <input style={styles.input} type="file" accept="image/*" onChange={handleImageChange} />
          </label>
          {previewImage && <img src={previewImage} alt="Preview" style={styles.previewImage} />}
        </div>
      </div>

      <div style={styles.sectionBox}>
        <p style={styles.sectionTitle}>Hành trình</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14 }}>
          <label style={styles.field}>
            <span>Điểm đi *</span>
            <input style={styles.input} name="tu" value={formData.tu} onChange={handleChange} required />
          </label>
          <label style={styles.field}>
            <span>Điểm đến *</span>
            <input style={styles.input} name="den" value={formData.den} onChange={handleChange} required />
          </label>
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
        <p style={styles.sectionTitle}>Thông tin ghế & Phương tiện</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
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
            <span>Hãng xe</span>
            <input style={styles.input} name="hangXe" value={formData.hangXe} onChange={handleChange} />
          </label>
          <label style={styles.field}>
            <span>Màu sắc</span>
            <input style={styles.input} name="mauSac" value={formData.mauSac} onChange={handleChange} />
          </label>
          <label style={styles.field}>
            <span>Biển số</span>
            <input style={styles.input} name="bienSo" value={formData.bienSo || ""} onChange={handleChange} placeholder="VD: 51B-123.45" />
          </label>
        </div>
        <label style={{...styles.field, marginTop: 12}}>
          <span>Tiện ích (phân cách bằng dấu phẩy)</span>
          <input
            style={styles.input}
            name="tienIch"
            value={formData.tienIch || ""}
            onChange={handleChange}
            placeholder="VD: Wifi, Nước uống..."
          />
        </label>
        {renderSeatMap("ghe")}
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.backgroundLayer}>
        <div style={styles.glowOne} />
        <div style={styles.glowTwo} />
        <div style={styles.gridOverlay} />
      </div>

      <div style={styles.contentShell}>
        <div style={styles.hero}>
          <div style={{ flex: "1 1 360px", minWidth: "280px" }}>
            <p style={styles.heroLabel}>Bảng điều khiển nhà xe</p>
            <h1 style={styles.heroTitle}>Quản lý chuyến xe của bạn</h1>
            <p style={styles.heroSubtitle}>
              Theo dõi trạng thái, cập nhật thông tin và tạo chuyến mới chỉ với vài bước.
            </p>
            <div style={styles.heroCtas}>
              <button style={styles.primaryCta} onClick={handleOpenAddForm}>
                <FaPlus /> Tạo chuyến mới
              </button>
              <button
                type="button"
                style={styles.secondaryCta}
                onClick={() => partnerId && fetchTrips(partnerId)}
              >
                <FaRocket /> Làm mới dữ liệu
              </button>
            </div>
          </div>
          <div style={styles.heroStats}>
            <div style={styles.heroStatCard}>
              <div style={styles.heroStatIcon}>
                <FaRocket />
              </div>
              <p style={styles.heroStatLabel}>Đang hoạt động</p>
              <p style={styles.heroStatValue}>{analytics.activeTrips}</p>
            </div>
            <div style={styles.heroStatCard}>
              <div style={styles.heroStatIcon}>
                <FaChartLine />
              </div>
              <p style={styles.heroStatLabel}>Độ phủ trung bình</p>
              <p style={styles.heroStatValue}>{analytics.averageOccupancy}%</p>
            </div>
            <div style={styles.heroStatCard}>
              <div style={styles.heroStatIcon}>
                <FaUsers />
              </div>
              <p style={styles.heroStatLabel}>Ghế đã phát hành</p>
              <p style={styles.heroStatValue}>{analytics.totalSeats}</p>
            </div>
          </div>
        </div>

        <div style={styles.metricsSection}>
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <div style={{ ...styles.metricAccent, background: "rgba(96,165,250,0.2)", color: "#93c5fd" }}>
                <FaStar />
              </div>
              <p style={styles.metricTitle}>Tổng số chuyến</p>
              <p style={styles.metricValue}>{analytics.totalTrips}</p>
              <p style={styles.metricSubtext}>Bao gồm tất cả trạng thái</p>
            </div>
            <div style={styles.metricCard}>
              <div style={{ ...styles.metricAccent, background: "rgba(74,222,128,0.18)", color: "#4ade80" }}>
                <FaChartLine />
              </div>
              <p style={styles.metricTitle}>Đang hiển thị</p>
              <p style={styles.metricValue}>{filteredTrips.length}</p>
              <p style={styles.metricSubtext}>
                {isFiltered ? "Theo bộ lọc hiện tại" : "Toàn bộ chuyến"}
              </p>
            </div>
            <div style={styles.metricCard}>
              <div style={{ ...styles.metricAccent, background: "rgba(248,113,113,0.18)", color: "#fca5a5" }}>
                <FaTicketAlt />
              </div>
              <p style={styles.metricTitle}>Ghế trong danh sách</p>
              <p style={styles.metricValue}>{filteredSeatCount}</p>
              <p style={styles.metricSubtext}>Tổng ghế của kết quả</p>
            </div>
            <div style={styles.metricCard}>
              <div style={{ ...styles.metricAccent, background: "rgba(248,250,252,0.14)", color: "#e2e8f0" }}>
                <FaFilter />
              </div>
              <p style={styles.metricTitle}>Bộ lọc</p>
              <p style={styles.metricValue}>{filterLabel}</p>
              <p style={styles.metricSubtext}>{isFiltered ? "Đang tinh chỉnh" : "Hiển thị mọi chuyến"}</p>
            </div>
          </div>
        </div>

        <div style={styles.scrollArea}>
          <div style={styles.toolbar}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
              <span
                style={{
                  ...styles.filterHint,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 600,
                }}
              >
                <FaFilter /> Bộ lọc trạng thái
              </span>
              <div style={styles.filterGroup}>
                {(
                  [
                    { value: "all", label: "Tất cả" },
                    { value: "active", label: "Đang hoạt động" },
                    { value: "paused", label: "Tạm dừng" },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStatusFilter(option.value)}
                    style={{
                      ...styles.filterButton,
                      ...(statusFilter === option.value ? styles.filterButtonActive : {}),
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <span style={styles.filterHint}>
                {isFiltered
                  ? `Đang hiển thị ${filteredTrips.length}/${trips.length} chuyến`
                  : `Tổng cộng ${trips.length} chuyến trong hệ thống`}
              </span>
            </div>
            <label style={styles.searchControl}>
              <FaSearch style={styles.searchIcon} />
              <input
                style={styles.searchInput}
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tuyến, mã tài, điểm đến..."
              />
            </label>
          </div>

          {loading && <div style={{ color: "#94a3b8", marginBottom: 16 }}>Đang tải dữ liệu...</div>}

          {authChecked && !partnerId ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyStateTitle}>Bạn chưa đăng nhập</p>
              <p style={styles.emptyStateText}>
                Đăng nhập bằng tài khoản nhà xe để xem và quản lý chuyến của mình.
              </p>
            </div>
          ) : filteredTrips.length === 0 && !loading ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyStateTitle}>{isFiltered ? "Không có kết quả" : "Chưa có chuyến xe"}</p>
              <p style={styles.emptyStateText}>{emptyCopy}</p>
              <button type="button" style={styles.emptyStateAction} onClick={handleOpenAddForm}>
                Tạo chuyến mới
              </button>
            </div>
          ) : (
            <div style={styles.cardContainer}>
              {filteredTrips.map((trip) => {
                const fallbackCount = trip.bookedSeats?.length ?? 0;
                const bookedCount = trip._id ? seatUsage[trip._id] ?? fallbackCount : fallbackCount;
                const capacity = trip.soLuongGhe || 0;
                const occupancyPercent = capacity > 0 ? Math.min(100, Math.round((bookedCount / capacity) * 100)) : 0;
                const remainingSeats = Math.max(0, capacity - bookedCount);
                const formattedPrice = trip.giaVe
                  ? `${trip.giaVe.toLocaleString("vi-VN")}₫`
                  : "Chưa cập nhật";
                const tripKey = trip._id ?? `${trip.maTai || "MỚI"}-${trip.tenChuyen}`;
                const nhaXeLabel = getNhaXeName(trip.nhaXe);

                return (
                  <div key={tripKey} style={styles.tripCard}>
                    <div style={styles.tripMedia}>
                      {trip.hinhAnh ? (
                        <>
                          <img src={trip.hinhAnh} alt={trip.tenChuyen} style={styles.tripImage} />
                          <div style={styles.mediaOverlay} />
                        </>
                      ) : (
                        <>
                          <div style={styles.imageFallback}>
                            <FaCarSide />
                          </div>
                          <div style={styles.mediaOverlay} />
                        </>
                      )}
                      <span
                        style={{
                          ...styles.tripStatusChip,
                          background:
                            trip.trangThai === "Hoạt động" ? "rgba(220,252,231,0.96)" : "rgba(254,226,226,0.96)",
                          color: trip.trangThai === "Hoạt động" ? "#15803d" : "#b91c1c",
                          borderColor: trip.trangThai === "Hoạt động" ? "#bbf7d0" : "#fecaca",
                        }}
                      >
                        {trip.trangThai}
                      </span>
                    </div>
                    <div style={styles.tripDetails}>
                      <div style={styles.tripInfoRow}>
                        <div>
                          <p style={styles.tripTag}>{trip.tenChuyen || "Chuyến đối tác"}</p>
                          <h3 style={styles.tripTitle}>{trip.tu} → {trip.den}</h3>
                          <p style={styles.tripRoute}>
                            <FaMapMarkerAlt /> {trip.tu} • {trip.den}
                          </p>
                          <p style={styles.tripDuration}>
                            {trip.ngayKhoiHanh || "Chưa cập nhật"} • {trip.gioKhoiHanh || "Chưa cập nhật"}
                          </p>
                        </div>
                        <div style={styles.badgeRow}>
                          <span style={styles.badge}>
                            <FaBuilding /> {nhaXeLabel}
                          </span>
                        </div>
                      </div>
                      <div style={styles.tripMetaRow}>
                        <div style={styles.tripMetaItem}>
                          <FaCalendarAlt style={{ color: palette.accent }} />
                          <div>
                            <p style={styles.tripMetaLabel}>Ngày khởi hành</p>
                            <p style={styles.tripMetaValue}>{trip.ngayKhoiHanh || "Chưa cập nhật"}</p>
                          </div>
                        </div>
                        <div style={styles.tripMetaItem}>
                          <FaClock style={{ color: palette.accent }} />
                          <div>
                            <p style={styles.tripMetaLabel}>Giờ khởi hành</p>
                            <p style={styles.tripMetaValue}>{trip.gioKhoiHanh || "Chưa cập nhật"}</p>
                          </div>
                        </div>
                        <div style={styles.tripMetaItem}>
                          <FaUsers style={{ color: palette.accent }} />
                          <div>
                            <p style={styles.tripMetaLabel}>Sức chứa</p>
                            <p style={styles.tripMetaValue}>{trip.soLuongGhe || 0} ghế</p>
                          </div>
                        </div>
                      </div>
                      <div style={styles.tripStatsRow}>
                        <p style={styles.tripStatsLabel}>
                          {bookedCount}/{capacity} ghế đã đặt • Còn {remainingSeats} ghế trống
                        </p>
                        <div style={styles.progressTrack}>
                          <div style={{ ...styles.progressFill, width: `${occupancyPercent}%` }} />
                        </div>
                      </div>
                      <div style={styles.badgeRow}>
                        <span style={styles.badge}>
                          <FaCarSide /> {trip.loaiXe || "Chưa rõ"}
                        </span>
                        <span style={styles.badge}>
                          <FaHashtag /> Mã {trip.maTai || "Đang cập nhật"}
                        </span>
                        <span style={styles.badge}>
                          <FaCarSide /> {trip.bienSo || "Chưa có biển"}
                        </span>
                        <span style={styles.badge}>
                          <FaPalette /> {trip.mauSac || "Màu chưa rõ"}
                        </span>
                        <span style={styles.badge}>
                          <FaMoneyBill /> {formattedPrice}
                        </span>
                      </div>
                    </div>
                    <div style={styles.tripActions}>
                      <div>
                        <p style={styles.priceLabel}>Giá vé</p>
                        <p style={styles.priceValue}>{formattedPrice}</p>
                        <p style={styles.seatNote}>Còn {remainingSeats} chỗ trống</p>
                      </div>
                      <div style={styles.actionButtons}>
                        <button
                          style={{
                            ...styles.footerBtn,
                            background: palette.accentSoft,
                            color: "#ffffff",
                            borderColor: palette.accentSoft,
                            boxShadow: "0 12px 26px rgba(99,102,241,0.35)",
                          }}
                          onClick={() => handleEditTrip(trip)}
                        >
                          <FaEdit /> Chỉnh sửa
                        </button>
                        <button
                          style={{ ...styles.footerBtn, background: palette.surface }}
                          onClick={() => trip._id && handleDeleteTrip(trip._id)}
                        >
                          <FaTrash /> Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.formHeader}>
              <div>
                <p style={styles.formHeaderLabel}>Tác vụ hiện tại</p>
                <h2 style={styles.formHeaderTitle}>
                  {formVariant
                    ? editingTrip
                      ? "Cập nhật chuyến xe"
                      : formVariant === "giuong"
                        ? "Thêm chuyến giường nằm"
                        : "Thêm chuyến ghế ngồi"
                    : "Chọn loại chuyến"}
                </h2>
              </div>
              <FaTimes style={{ cursor: "pointer" }} onClick={closeForm} />
            </div>

            {formVariant ? (
              <form style={styles.formLayout} onSubmit={handleSubmit}>
                <div style={styles.formBody}>{formVariant === "giuong" ? renderGiUongForm() : renderGheForm()}</div>
                <div style={styles.formFooter}>
                  <button type="button" style={{ ...styles.actionBtn, ...styles.secondaryBtn }} onClick={closeForm}>
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
            ) : (
              <div style={{ ...styles.variantPanel, ...styles.variantScrollArea }}>
                <p style={styles.variantPrompt}>Chọn cấu hình chuyến xe phù hợp</p>
                <div style={styles.variantGrid}>
                  <button
                    type="button"
                    onClick={() => handleVariantSelect("giuong")}
                    style={{
                      ...styles.variantCard,
                      background: "#fff",
                      borderColor: "#e0e7ff",
                      color: "#312e81",
                    }}
                  >
                    🚍 Giường nằm
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      Đầy đủ tiện ích, phù hợp tuyến dài.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVariantSelect("ghe")}
                    style={{
                      ...styles.variantCard,
                      background: "#fff",
                      borderColor: "#bae6fd",
                      color: "#0f766e",
                    }}
                  >
                    💺 Ghế ngồi
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      Thiết kế riêng cho xe ghế ngồi.
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
