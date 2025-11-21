import { useState, useEffect } from "react";
import { getPromotions } from "../../api/promotionsApi"; // 🟢 Lấy API thật

interface PromotionItem {
  _id: string;
  code: string;
  discountType: "percentage" | "amount";
  discountValue: number;
  maxUsage: number;
  startDate: string;
  endDate: string;
  description?: string;
  image?: string;
}

export default function Promotion() {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPromo, setSelectedPromo] = useState<PromotionItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 🟢 Lấy dữ liệu thật từ API
  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const data = await getPromotions();
      setPromotions(data);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách khuyến mãi:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert("✅ Đã sao chép mã khuyến mãi!");
  };

  const handlePromoClick = (promo: PromotionItem) => {
    setSelectedPromo(promo);
    setShowDetailModal(true);
  };

  const handleShare = () => {
    if (selectedPromo) {
      const shareText = `🎁 Mã khuyến mãi: ${selectedPromo.code}\n${selectedPromo.description || "Ưu đãi hấp dẫn!"}\nGiảm ${
        selectedPromo.discountType === "percentage"
          ? `${selectedPromo.discountValue}%`
          : `${selectedPromo.discountValue.toLocaleString("vi-VN")}₫`
      }`;
      const shareUrl = window.location.href;

      if (navigator.share) {
        navigator
          .share({
            title: `Mã khuyến mãi ${selectedPromo.code}`,
            text: shareText,
            url: shareUrl,
          })
          .catch(() => copyShareLink(shareText));
      } else {
        copyShareLink(shareText);
      }
    }
  };

  const copyShareLink = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("✅ Đã sao chép thông tin khuyến mãi!");
  };

  const formatDiscount = (promo: PromotionItem) =>
    promo.discountType === "percentage"
      ? `${promo.discountValue}%`
      : `${promo.discountValue.toLocaleString("vi-VN")}₫`;

  const getImageUrl = (image?: string) => {
    if (!image) return "https://via.placeholder.com/400x200?text=Khuyến+mãi";
    if (image.startsWith("http")) return image;
    return `http://localhost:5000/${image}`;
  };

  // 🟡 Loading UI
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #e0f2fe",
            borderTop: "3px solid #0284c7",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ color: "#64748b", marginTop: "16px", fontSize: "14px" }}>
          Đang tải khuyến mãi...
        </p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
      
        padding: "32px 20px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h2
          style={{
            color: "#e5ebe9ff",
            fontSize: "35px",
            fontWeight: 600,
            marginBottom: "8px",
            letterSpacing: "-0.025em",
          }}
        >
          Khuyến mãi
        </h2>
        <p style={{ color: "#ebedf1ff", fontSize: "20px", marginBottom: "28px" }}>
          Các chương trình ưu đãi đặc biệt dành cho bạn
        </p>

        {promotions.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#94a3b8",
              padding: "60px 20px",
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            Chưa có chương trình khuyến mãi nào
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            {promotions.map((promo) => (
              <div
                key={promo._id}
                onClick={() => handlePromoClick(promo)}
                style={{
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform =
                    "translateY(-2px)";
                  (e.currentTarget as HTMLElement).style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.08)";
                  (e.currentTarget as HTMLElement).style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                }}
              >
                <div style={{ position: "relative", height: "140px" }}>
                  <img
                    src={getImageUrl(promo.image)}
                    alt={promo.code}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      background: "#0284c7",
                      color: "#ffffff",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {formatDiscount(promo)}
                  </div>
                </div>

                <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div
                      style={{
                        background: "#f0f9ff",
                        color: "#075985",
                        padding: "6px 10px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 600,
                        display: "inline-block",
                        marginBottom: "10px",
                      }}
                    >
                      {promo.code}
                    </div>
                    {promo.description && (
                      <p
                        style={{
                          color: "#334155",
                          fontSize: "13px",
                          marginBottom: "10px",
                          lineHeight: "1.5",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {promo.description}
                      </p>
                    )}
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "12px",
                      }}
                    >
                      HSD:{" "}
                      <span style={{ fontWeight: 500, color: "#475569" }}>
                        {new Date(promo.endDate).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyToClipboard(promo.code);
                    }}
                    style={{
                      width: "100%",
                      background: "#0284c7",
                      color: "#ffffff",
                      padding: "9px",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                      marginTop: "12px",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "#0369a1";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = "#0284c7";
                    }}
                  >
                    Sao chép mã
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🔹 Modal chi tiết */}
      {showDetailModal && selectedPromo && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setShowDetailModal(false)}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "480px",
              overflow: "hidden",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
              display: "flex",
              flexDirection: "column",
              height: "auto",
              maxHeight: "90vh",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ position: "relative" }}>
              <img
                src={getImageUrl(selectedPromo.image)}
                alt={selectedPromo.code}
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                }}
              />
              <button
                onClick={() => setShowDetailModal(false)}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: "#ffffff",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  fontSize: "18px",
                  fontWeight: "600",
                  cursor: "pointer",
                  color: "#64748b",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                ×
              </button>
            </div>

            {/* 🔹 Nội dung modal + nút luôn ở đáy */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                padding: "24px",
              }}
            >
              <div style={{ flex: 1, overflowY: "auto" }}>
                <h3
                  style={{
                    color: "#0f172a",
                    fontSize: "18px",
                    fontWeight: 600,
                    marginBottom: "4px",
                    lineHeight: "1.4",
                  }}
                >
                  {selectedPromo.description || `Mã ${selectedPromo.code}`}
                </h3>

                <div
                  style={{
                    background: "#f0f9ff",
                    borderRadius: "8px",
                    padding: "14px",
                    marginTop: "16px",
                    border: "1px solid #e0f2fe",
                  }}
                >
                  <p
                    style={{
                      color: "#64748b",
                      fontSize: "12px",
                      marginBottom: "6px",
                    }}
                  >
                    Mã khuyến mãi
                  </p>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <code
                      style={{
                        fontWeight: 600,
                        color: "#075985",
                        fontSize: "15px",
                        flex: 1,
                      }}
                    >
                      {selectedPromo.code}
                    </code>
                    <button
                      onClick={() => copyToClipboard(selectedPromo.code)}
                      style={{
                        background: "#0284c7",
                        color: "#ffffff",
                        border: "none",
                        padding: "6px 14px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Sao chép
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "16px",
                    padding: "14px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    fontSize: "13px",
                    lineHeight: "1.8",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Ngày bắt đầu</span>
                    <span style={{ color: "#334155", fontWeight: 500 }}>
                      {new Date(selectedPromo.startDate).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Ngày kết thúc</span>
                    <span style={{ color: "#334155", fontWeight: 500 }}>
                      {new Date(selectedPromo.endDate).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Số lần sử dụng</span>
                    <span style={{ color: "#334155", fontWeight: 500 }}>
                      {selectedPromo.maxUsage}
                    </span>
                  </div>
                </div>
              </div>

              {/* 🔹 Nút luôn ở đáy */}
              <button
                onClick={handleShare}
                style={{
                  width: "100%",
                  background: "#0284c7",
                  color: "#ffffff",
                  fontWeight: 500,
                  border: "none",
                  padding: "12px",
                  borderRadius: "8px",
                  marginTop: "18px",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background 0.2s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#0369a1";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#0284c7";
                }}
              >
                Chia sẻ khuyến mãi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
