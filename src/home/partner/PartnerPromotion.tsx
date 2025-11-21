import React, { useState, useEffect } from "react";
import {
  getPromotions,
  createPromotion,
  deletePromotion,
} from "../../api/promotionsApi";

interface Promotion {
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

export default function PartnerPromotion() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "amount">(
    "percentage"
  );
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxUsage, setMaxUsage] = useState<number>(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, []);

  useEffect(() => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreviewUrl("");
    }
  }, [file]);

  const fetchPromotions = async () => {
    try {
      const data = await getPromotions();
      setPromotions(Array.isArray(data) ? data : data.promotions || []);
    } catch (err) {
      console.error("❌ Lỗi khi tải danh sách khuyến mãi:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) return alert("⚠️ Vui lòng nhập mã giảm giá!");
    if (!discountValue || discountValue <= 0)
      return alert("⚠️ Vui lòng nhập giá trị giảm hợp lệ!");
    if (!startDate || !endDate)
      return alert("⚠️ Vui lòng chọn ngày bắt đầu và kết thúc!");
    if (new Date(startDate) > new Date(endDate))
      return alert("⚠️ Ngày kết thúc phải sau ngày bắt đầu!");

    const formData = new FormData();
    formData.append("code", code.trim());
    formData.append("discountType", discountType);
    formData.append("discountValue", discountValue.toString());
    formData.append("maxUsage", maxUsage.toString());
    formData.append("startDate", startDate);
    formData.append("endDate", endDate);
    formData.append("description", description.trim());
    if (file) formData.append("image", file);

    try {
      setLoading(true);
      const res = await createPromotion(formData);
      alert(res.message || "✅ Tạo khuyến mãi thành công!");
      await fetchPromotions();
      setCode("");
      setDiscountType("percentage");
      setDiscountValue(10);
      setMaxUsage(1);
      setStartDate("");
      setEndDate("");
      setDescription("");
      setFile(null);
      setPreviewUrl("");
    } catch (err: any) {
      console.error("❌ Lỗi khi tạo mã:", err.response?.data || err.message);
      alert(err.response?.data?.message || "❌ Lỗi khi tạo mã giảm giá!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("🗑️ Bạn có chắc muốn xóa khuyến mãi này không?")) return;
    try {
      await deletePromotion(id);
      alert("✅ Đã xóa khuyến mãi thành công!");
      fetchPromotions();
    } catch (err: any) {
      console.error("❌ Lỗi khi xóa mã:", err);
      alert("❌ Không thể xóa khuyến mãi!");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "32px 24px" }}>
      <style>{`
        * { box-sizing: border-box; }
        .container { max-width: 1200px; margin: 0 auto; }
        .form-card {
          background: white;
          border-radius: 12px;
          padding: 32px;
          margin-bottom: 32px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .form-title { font-size: 24px; font-weight: 600; color: #0f172a; margin-bottom: 24px; }
        .form-grid { display: grid; gap: 20px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 768px) { .form-row { grid-template-columns: 1fr; } }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-label { font-size: 14px; font-weight: 500; color: #475569; }
        .form-input, .form-select, .form-textarea {
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 15px;
          color: #1e293b;
          background: white;
          transition: all 0.2s;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .form-textarea { resize: vertical; min-height: 80px; }
        .file-input-wrapper { position: relative; width: 100%; }
        .file-input-label {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; padding: 10px 14px;
          background: #f1f5f9;
          border: 1.5px dashed #cbd5e1;
          border-radius: 8px; cursor: pointer;
          transition: all 0.2s; color: #64748b; font-size: 14px;
        }
        .file-input-label:hover { background: #e2e8f0; border-color: #94a3b8; }
        .file-input { position: absolute; left: -9999px; }
        .preview-box { margin-top: 12px; border-radius: 8px; overflow: hidden; border: 1.5px solid #e2e8f0; }
        .preview-box img { width: 100%; height: 200px; object-fit: cover; display: block; }
        .submit-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white; padding: 12px 28px; border: none; border-radius: 8px;
          font-size: 15px; font-weight: 500; cursor: pointer;
          transition: all 0.2s; width: 100%; margin-top: 8px;
        }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .promo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .promo-card {
          position: relative;
          background: white; border-radius: 12px; overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: all 0.2s;
        }
        .promo-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .promo-image { width: 100%; height: 180px; object-fit: cover; background: #f1f5f9; }
        .promo-content { padding: 20px; }
        .promo-code { font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 12px; }
        .promo-info { font-size: 14px; color: #64748b; line-height: 1.5; margin: 6px 0; }
        .promo-desc { font-size: 13px; color: #94a3b8; font-style: italic; margin-top: 12px; border-top: 1px solid #f1f5f9; padding-top: 12px; }
        .delete-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #fee2e2;
          border: none;
          color: #dc2626;
          font-size: 13px;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .delete-btn:hover { background: #fecaca; }
        .empty-state { text-align: center; padding: 60px 20px; color: #94a3b8; }
        .discount-badge {
          display: inline-block; background: #dbeafe; color: #1e40af;
          padding: 4px 12px; border-radius: 6px; font-weight: 600; font-size: 14px;
        }
      `}</style>

      <div className="container">
        {/* 🧾 Form tạo khuyến mãi */}
        <div className="form-card">
          <h1 className="form-title">🎁 Tạo khuyến mãi mới</h1>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Mã giảm giá</label>
                  <input
                    className="form-input"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Loại giảm giá</label>
                  <select
                    className="form-select"
                    value={discountType}
                    onChange={(e) =>
                      setDiscountType(e.target.value as "percentage" | "amount")
                    }
                  >
                    <option value="percentage">Giảm theo %</option>
                    <option value="amount">Giảm theo số tiền (₫)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Giá trị giảm</label>
                  <input
                    className="form-input"
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số lần sử dụng tối đa</label>
                  <input
                    className="form-input"
                    type="number"
                    value={maxUsage}
                    onChange={(e) => setMaxUsage(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ngày bắt đầu</label>
                  <input
                    className="form-input"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày kết thúc</label>
                  <input
                    className="form-input"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả chi tiết</label>
                <textarea
                  className="form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hình ảnh khuyến mãi</label>
                <div className="file-input-wrapper">
                  <label className="file-input-label">
                    📷 {file ? file.name : "Chọn hình ảnh"}
                    <input
                      className="file-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                {previewUrl && (
                  <div className="preview-box">
                    <img src={previewUrl} alt="Preview" />
                  </div>
                )}
              </div>

              <button className="submit-btn" type="submit" disabled={loading}>
                {loading ? "Đang tạo..." : "Tạo khuyến mãi"}
              </button>
            </div>
          </form>
        </div>

        {/* 📋 Danh sách khuyến mãi */}
        <h2 className="form-title">🌟 Danh sách khuyến mãi</h2>
        {promotions.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎁</div>
            <div>Chưa có khuyến mãi nào</div>
          </div>
        ) : (
          <div className="promo-grid">
            {promotions.map((p) => (
              <div key={p._id} className="promo-card">
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(p._id)}
                >
                  🗑️
                </button>
                {(p.image || (p as any).imageUrl) && (
                  <img
                    src={p.image || (p as any).imageUrl}
                    alt={p.code}
                    className="promo-image"
                  />
                )}
                <div className="promo-content">
                  <h4 className="promo-code">{p.code}</h4>
                  <p className="promo-info">
                    <span className="discount-badge">
                      {p.discountType === "percentage"
                        ? `${p.discountValue}%`
                        : `${p.discountValue.toLocaleString()}₫`}
                    </span>
                  </p>
                  <p className="promo-info">
                    {new Date(p.startDate).toLocaleDateString()} -{" "}
                    {new Date(p.endDate).toLocaleDateString()}
                  </p>
                  <p className="promo-info">Số lượt tối đa: {p.maxUsage}</p>
                  {p.description && (
                    <p className="promo-desc">📝 {p.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
