import { useEffect, useState } from "react";
import {
  getFeeConfig,
  getFeeHistory,
  getBookingsByPercent,
  updateFeeConfig,
} from "../../api/feeApi";
import { socket } from "../../utils/socket";

// ✅ THÊM: Định nghĩa styles trước component
const styles: any = {
  container: {
    padding: "2rem",
    maxWidth: "900px",
    margin: "0 auto",
    fontFamily: "Inter, sans-serif",
    background: "#f9fafb",
    minHeight: "100vh",
  },
  title: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#111827",
    marginBottom: "8px",
  },
  desc: {
    opacity: 0.7,
    marginBottom: "24px",
    color: "#6b7280",
  },
  card: {
    padding: "24px",
    borderRadius: "12px",
    background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginBottom: "24px",
  },
  feeValue: {
    color: "#2563eb",
    fontSize: "32px",
  },
  feeDesc: {
    color: "#6b7280",
    marginBottom: "16px",
  },
  feeInputGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "12px",
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "16px",
  },
  percent: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#6b7280",
  },
  button: {
    background: "#2563eb",
    color: "white",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    border: "none",
    fontSize: "16px",
    fontWeight: "600",
    transition: "all 0.3s",
    marginTop: "12px",
  },
  loading: {
    textAlign: "center",
    padding: "40px",
    fontSize: "18px",
  },
  empty: {
    color: "#9ca3af",
    fontStyle: "italic",
  },
  historyItem: {
    padding: "16px",
    borderBottom: "1px solid #e5e7eb",
    marginBottom: "12px",
  },
  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  feeChange: {
    fontSize: "16px",
    fontWeight: "600",
    color: "#111827",
  },
  timestamp: {
    color: "#9ca3af",
    fontSize: "12px",
  },
  historyAdmin: {
    margin: "8px 0",
    color: "#6b7280",
    fontSize: "14px",
  },
  viewBtn: {
    marginTop: "12px",
    padding: "8px 16px",
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  },
  transactionsList: {
    maxHeight: "500px",
    overflowY: "auto" as const,
  },
  transactionItem: {
    padding: "16px",
    borderBottom: "1px solid #e5e7eb",
    marginBottom: "12px",
    background: "#f3f4f6",
    borderRadius: "8px",
  },
  bookingHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  bookingId: {
    fontSize: "14px",
    color: "#6b7280",
    fontFamily: "monospace",
  },
  statusBadge: {
    padding: "4px 10px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
  },
  price: {
    color: "#dc2626",
    fontSize: "16px",
  },
  feeDetailBox: {
    marginTop: "10px",
    padding: "10px",
    background: "#fef3c7",
    borderLeft: "3px solid #ca8a04",
    borderRadius: "6px",
    color: "#92400e",
  },
};

export default function AdminServiceFee() {
  const [fee, setFee] = useState<number>(0);
  const [newFee, setNewFee] = useState<string>("");
  const [appliedDate, setAppliedDate] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedPercent, setSelectedPercent] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  const adminId = localStorage.getItem("adminId") || "ADMIN123";

  const fetchFee = async () => {
    try {
      const res = await getFeeConfig();
      const feePercent = res?.fee?.percent ?? res?.percent ?? 0;
      setFee(feePercent);
      setNewFee(feePercent.toString());
      const today = new Date().toISOString().split("T")[0];
      setAppliedDate(today);
    } catch (err) {
      console.error("Lỗi lấy phí:", err);
      setFee(0);
      setNewFee("0");
      alert("Không thể lấy phí dịch vụ. Kiểm tra backend.");
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await getFeeHistory();
      setHistory(res?.history || []);
    } catch (err) {
      console.error("Lỗi lấy lịch sử phí:", err);
      setHistory([]);
      alert("Lỗi lấy lịch sử phí");
    }
  };

  const updateFee = async () => {
    const feeValue = Number(newFee);

    if (!newFee || feeValue < 0 || feeValue > 100) {
      alert("Phần trăm phí không hợp lệ (0-100%)!");
      return;
    }

    if (!appliedDate) {
      alert("Vui lòng chọn ngày áp dụng!");
      return;
    }

    try {
      setUpdating(true);
      const res = await updateFeeConfig(feeValue, adminId, appliedDate);

      if (res?.success) {
        alert(
          `✅ Cập nhật phí thành công!\nÁp dụng từ: ${new Date(appliedDate).toLocaleDateString("vi-VN")}`
        );
        
        // ✅ FIX: Fetch TRƯỚC khi clear input
        await fetchFee();
        await fetchHistory();
        
        // ✅ Clear input AFTER fetch
        setNewFee("");
        setAppliedDate("");
        
      } else {
        alert(`❌ Cập nhật thất bại: ${res?.message}`);
      }
    } catch (err: any) {
      console.error("Lỗi cập nhật phí:", err);
      alert(`❌ Cập nhật thất bại: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const fetchTransactionByFee = async (percent: number) => {
    try {
      console.log(`🚀 Fetching bookings for fee ${percent}%...`);

      const res = await getBookingsByPercent(percent);

      console.log("✅ Response:", {
        success: res?.success,
        total: res?.bookings?.length,
      });

      if (!res?.bookings || res.bookings.length === 0) {
        alert(`⚠️ Không có booking nào áp dụng phí ${percent}%`);
        setSelectedPercent(null);
        setTransactions([]);
        return;
      }

      setSelectedPercent(percent);
      setTransactions(res.bookings || []);
    } catch (err: any) {
      console.error("❌ Lỗi lấy dữ liệu giao dịch:", err.message);
      setSelectedPercent(null);
      setTransactions([]);
      alert(`❌ Lỗi lấy dữ liệu: ${err.message}`);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        await fetchFee();
        await fetchHistory();
      } catch (err) {
        console.error("Lỗi load ban đầu:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <p style={styles.loading}>⏳ Đang tải...</p>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>💰 Quản lý phí dịch vụ</h1>
      <p style={styles.desc}>
        Thiết lập & quản lý mức phí dịch vụ áp dụng cho các nhà xe.
      </p>

      {/* 1. KHỐI CHỈNH PHÍ HIỆN TẠI */}
      <div style={styles.card}>
        <h2>
          ✨ Phí hiện tại: <b style={styles.feeValue}>{fee}%</b>
        </h2>
        <p style={styles.feeDesc}>
          Phí này sẽ được áp dụng cho tất cả <b>booking mới</b> từ ngày được
          chọn
        </p>

        <div style={styles.feeInputGroup}>
          <input
            type="number"
            style={styles.input}
            value={newFee}
            onChange={(e) => setNewFee(e.target.value)}
            placeholder="Nhập phần trăm phí (0-100)"
            min="0"
            max="100"
            disabled={updating}
          />
          <span style={styles.percent}>%</span>
        </div>

        <div style={styles.feeInputGroup}>
          <label style={{ flex: 1, color: "#6b7280", fontWeight: 500 }}>
            📅 Ngày áp dụng:
          </label>
          <input
            type="date"
            style={styles.input}
            value={appliedDate}
            onChange={(e) => setAppliedDate(e.target.value)}
            disabled={updating}
          />
        </div>

        <p style={{ color: "#9ca3af", fontSize: "13px", margin: "8px 0 0 0" }}>
          💡 Lưu ý: Booking được tạo trước ngày này sẽ giữ nguyên phí cũ
        </p>

        <button
          style={{
            ...styles.button,
            opacity: updating ? 0.6 : 1,
            cursor: updating ? "not-allowed" : "pointer",
          }}
          onClick={updateFee}
          disabled={updating}
        >
          {updating ? "Đang cập nhật..." : "Cập nhật phí"}
        </button>
      </div>

      {/* 2. LỊCH SỬ THAY ĐỔI PHÍ */}
      <div style={styles.card}>
        <h2>📜 Lịch sử thay đổi phí</h2>

        {history.length === 0 ? (
          <p style={styles.empty}>Chưa có thay đổi phí nào.</p>
        ) : (
          history.map((h, index) => (
            <div key={index} style={styles.historyItem}>
              <div style={styles.historyHeader}>
                <span style={styles.feeChange}>
                  {h.oldPercent}% → <b>{h.newPercent}%</b>
                </span>
                <small style={styles.timestamp}>
                  📅 Áp dụng từ: {new Date(h.appliedAt).toLocaleString("vi-VN")}
                </small>
              </div>
              <p style={styles.historyAdmin}>
                👤 Cập nhật bởi: <b>{h.updatedBy || "Admin"}</b>
              </p>

              <button
                style={styles.viewBtn}
                onClick={() => fetchTransactionByFee(h.newPercent)}
              >
                📊 Xem giao dịch áp dụng mức phí này
              </button>
            </div>
          ))
        )}
      </div>

      {/* 3. DANH SÁCH BOOKING ÁP DỤNG PHÍ % */}
      {selectedPercent !== null && (
        <div style={styles.card}>
          <h2>
            📦 Booking áp dụng phí <b>{selectedPercent}%</b>
          </h2>

          {transactions.length === 0 ? (
            <p style={styles.empty}>Không có booking nào với phí này.</p>
          ) : (
            <div style={styles.transactionsList}>
              {transactions.map((bk) => (
                <div key={bk._id} style={styles.transactionItem}>
                  <div style={styles.bookingHeader}>
                    <span style={styles.bookingId}>ID: {bk._id}</span>
                    <span
                      style={{
                        ...styles.statusBadge,
                        background:
                          bk.status === "paid"
                            ? "#dcfce7"
                            : bk.status === "pending"
                            ? "#fef3c7"
                            : "#fee2e2",
                        color:
                          bk.status === "paid"
                            ? "#15803d"
                            : bk.status === "pending"
                            ? "#b45309"
                            : "#dc2626",
                      }}
                    >
                      {bk.status}
                    </span>
                  </div>

                  <p>
                    👤 Khách: <b>{bk.hoTen || bk.name || "N/A"}</b>
                  </p>
                  <p>
                    🚌 Chuyến: <b>{bk.tenChuyen || "N/A"}</b>
                  </p>
                  <p>
                    💵 Tổng tiền:
                    <b style={styles.price}>
                      {(bk.finalTotal || bk.totalPrice || 0).toLocaleString(
                        "vi-VN"
                      )}
                      ₫
                    </b>
                  </p>

                  <div style={styles.feeDetailBox}>
                    <p style={{ margin: "4px 0", fontSize: "13px" }}>
                      📌 Phí áp dụng: <b>{selectedPercent}%</b>
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "13px" }}>
                      💰 Số tiền phí:
                      <b style={{ color: "#dc2626" }}>
                        {(
                          bk.serviceFeeAmount ||
                          (((bk.finalTotal || bk.totalPrice || 0) *
                            selectedPercent) /
                            100)
                        ).toLocaleString("vi-VN")}
                        ₫
                      </b>
                    </p>
                    <p style={{ margin: "4px 0", fontSize: "13px" }}>
                      📅 Ngày tạo:
                      <b>{new Date(bk.feeAppliedAt).toLocaleString("vi-VN")}</b>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
