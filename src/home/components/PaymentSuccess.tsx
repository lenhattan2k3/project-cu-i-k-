import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5000";
type SyncState = "idle" | "pending" | "success" | "error";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const orderCode = searchParams.get("orderCode");
  const amount = searchParams.get("amount");
  const statusParam = searchParams.get("status")?.toUpperCase();
  const isSuccess = !statusParam || statusParam === "PAID" || statusParam === "SUCCESS";
  const amountNumber = amount != null && !Number.isNaN(Number(amount)) ? Number(amount) : undefined;

  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [syncMessage, setSyncMessage] = useState<string>(isSuccess ? "Đang xác nhận thanh toán..." : "");

  useEffect(() => {
    if (!orderCode) {
      setSyncState("error");
      setSyncMessage("Không tìm thấy mã giao dịch để xác nhận.");
      return;
    }

    let cancelled = false;

    const confirmPayment = async () => {
      setSyncState("pending");
      setSyncMessage("Đang ghi nhận thanh toán và cập nhật vé...");
      try {
        const res = await fetch(`${API_BASE}/api/payos/confirm-return`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderCode, status: statusParam, amount: amountNumber }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || "Không thể xác nhận giao dịch");
        }

        if (String(data.paymentStatus).toLowerCase() === "paid") {
          setSyncState("success");
          setSyncMessage("Đã lưu vé và hóa đơn của bạn. Bạn sẽ được chuyển sang mục Hóa đơn.");
        } else {
          setSyncState("pending");
          setSyncMessage(`Giao dịch đang ở trạng thái ${data.paymentStatus || "khác"}. Vui lòng chờ thêm.`);
        }
      } catch (err) {
        if (cancelled) return;
        setSyncState("error");
        setSyncMessage(err instanceof Error ? err.message : "Không thể xác nhận giao dịch");
      }
    };

    confirmPayment();
    return () => {
      cancelled = true;
    };
  }, [orderCode, statusParam, amountNumber]);

  const targetTab = isSuccess ? "invoices" : "booking";
  const nextTab = syncState === "success" ? "invoices" : targetTab;

  const invoiceBanner = isSuccess
    ? "Thanh toán PayOS thành công. Vé và hóa đơn đã được ghi nhận."
    : "PayOS chưa xác nhận thanh toán. Vui lòng kiểm tra lại.";

  const buildRedirectState = () => ({
    tab: nextTab,
    fromPayment: true,
    highlightOrderCode: isSuccess ? orderCode ?? undefined : undefined,
    bannerMessage: invoiceBanner,
  });
  const buildRedirectPath = () => `/homeuser/${nextTab}`;

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(buildRedirectPath(), { replace: true, state: buildRedirectState() });
    }, 3500);
    return () => clearTimeout(timer);
  }, [navigate, nextTab, invoiceBanner, isSuccess, orderCode]);

  const amountDisplay = amountNumber != null ? amountNumber.toLocaleString("vi-VN") : null;
  const messageColor = syncState === "error" ? "#b91c1c" : syncState === "success" ? "#0f172a" : "#475569";
  const statusHeading = syncState === "success" ? "Thanh toán đã được xác nhận" : isSuccess ? "Thanh toán đang xác thực" : "Thanh toán chưa hoàn tất";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e3a8a, #2563eb, #3b82f6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        color: "#0f172a",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#fff",
          borderRadius: "24px",
          padding: "32px",
          textAlign: "center",
          boxShadow: "0 30px 80px rgba(15, 23, 42, 0.25)",
        }}
      >
        <div
          style={{
            width: "72px",
            height: "72px",
            margin: "0 auto 20px",
            borderRadius: "50%",
            background: syncState === "error" ? "#fee2e2" : "#dcfce7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
            color: syncState === "error" ? "#b91c1c" : "#15803d",
          }}
        >
          {syncState === "error" ? "!" : "✓"}
        </div>

        <h1 style={{ margin: "0 0 12px", fontSize: "1.8rem", color: "#0f172a" }}>
          {statusHeading}
        </h1>
        <p style={{ margin: 0, color: "#475569", lineHeight: 1.5 }}>
          {isSuccess
            ? "Chúng tôi đã ghi nhận giao dịch qua PayOS. Bạn sẽ được đưa về mục vé để kiểm tra trạng thái đặt vé."
            : "PayOS chưa xác nhận thanh toán. Vui lòng kiểm tra lại hoặc thử thực hiện giao dịch khác."}
        </p>

        <div
          style={{
            marginTop: "20px",
            padding: "16px",
            borderRadius: "16px",
            background: "#f8fafc",
            border: "1px dashed #cbd5f5",
            color: "#0f172a",
            textAlign: "left",
          }}
        >
          {orderCode && (
            <p style={{ margin: "0 0 8px", fontWeight: 600 }}>
              Mã giao dịch: <span style={{ color: "#2563eb" }}>{orderCode}</span>
            </p>
          )}
          {amountDisplay && (
            <p style={{ margin: 0 }}>
              Số tiền: <strong>{amountDisplay}₫</strong>
            </p>
          )}
          {!orderCode && !amount && (
            <p style={{ margin: 0 }}>Vui lòng kiểm tra mục vé của bạn để xem chi tiết giao dịch.</p>
          )}
        </div>

        {syncMessage && (
          <p style={{ marginTop: "20px", color: messageColor, fontSize: "0.95rem" }}>{syncMessage}</p>
        )}

        <p style={{ marginTop: "12px", color: "#94a3b8", fontSize: "0.9rem" }}>
          Tự động chuyển trong giây lát...
        </p>

        <button
          onClick={() => navigate(buildRedirectPath(), { replace: true, state: buildRedirectState() })}
          style={{
            marginTop: "12px",
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#fff",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
          }}
        >
          Về trang quản lý vé
        </button>
      </div>
    </div>
  );
}
