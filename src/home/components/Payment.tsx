import React, { useEffect, useState } from "react";
// Giả sử 'auth' được export từ file config. 
// Nếu đường dẫn sai, bạn cần chỉnh lại cho đúng với cấu trúc dự án của mình.
import { auth } from "../../firebase/config"; 
import axios from "axios";

// --- API BANK (Giữ nguyên) ---
const API_URL = "http://localhost:5000/api/bank";

interface LinkBankData {
  userId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

const linkBank = async (data: LinkBankData) => {
  const res = await axios.post(`${API_URL}/link`, data);
  return res.data;
};

const getBankByUser = async (userId: string) => {
  const res = await axios.get(`${API_URL}/${userId}`);
  return res.data;
};

const unlinkBank = async (userId: string) => {
  const res = await axios.patch(`${API_URL}/unlink/${userId}`);
  return res.data;
};

// --- DANH SÁCH NGÂN HÀNG (Giữ nguyên) ---
const banks = [
  { name: "Vietcombank", code: "VCB", logo: "https://cdn.haitrieu.com/wp-content/uploads/2022/02/Logo-Vietcombank.png" },
  { name: "Techcombank", code: "TCB", logo: "https://tse4.mm.bing.net/th/id/OIP.K2hktStEABOr11nKYHMbTgHaHZ?rs=1&pid=ImgDetMain&o=7&rm=3" },
  { name: "VietinBank", code: "CTG", logo: "https://tse4.mm.bing.net/th/id/OIP.wpdUUJWZoVs9XaXHhULKHgHaFU?rs=1&pid=ImgDetMain&o=7&rm=3" },
  { name: "BIDV", code: "BIDV", logo: "https://tse4.mm.bing.net/th/id/OIP.SFSQzm3LsaSVogADPxg7zwHaEq?rs=1&pid=ImgDetMain&o=7&rm=3" },
  { name: "Agribank", code: "AGR", logo: "https://tse4.mm.bing.net/th/id/OIP.VVr3Xe-PMZX5F3dtbJi9cgHaE7?rs=1&pid=ImgDetMain&o=7&rm=3" },
  { name: "Wells Fargo", code: "WFC", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Wells_Fargo_Bank_logo.svg/1200px-Wells_Fargo_Bank_logo.svg.png" }
];

// ✅ Lấy logo từ danh sách
const getBankLogo = (name: string): string => {
    const bank = banks.find(b => b.name === name);
    // Fallback cho logo nếu không tìm thấy
    return bank?.logo || "https://placehold.co/40x40/333/FFF?text=B"; 
};

// ✅ Mask số tài khoản
const maskAccountNumber = (num: string): string => {
    if (!num) return "•••• 1234";
    return `•••• ${num.slice(-4)}`;
};

// ✅ Component chứa CSS
const BankFormStyles = () => (
  <style>{`
    /* --- Fonts (Giả định bạn đã import font Inter hoặc Poppins trong file index.css) --- */
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        "Helvetica Neue", Arial, sans-serif;
      margin: 0;
    }

    /* --- Layout chính --- */
    .payment-page-container {
      min-height: 100vh;
     
      padding: ;
      display: flex;
      justify-content: center;
      box-sizing: border-box;
    }

    .payment-content-wrapper {
      width: 100%;
      max-width: 1700px;
    }

    .payment-page-title {
      font-size: 2.25rem; /* 36px */
      font-weight: 700;
      color:rgb(3, 29, 58);
      margin-bottom: 32px;
    }

    .payment-section-title {
      font-size: 1.125rem; /* 18px */
      font-weight: 600;
      color: #111827;
      margin-top: 40px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    /* --- Thẻ Loading --- */
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 50vh;
      font-size: 1.1rem;
      color: #6b7280;
    }

    .loading-placeholder-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      color: #6b7280;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06);
    }

    /* --- Thẻ ngân hàng đã liên kết --- */
    .linked-bank-card {
      display: flex;
      flex-wrap: wrap; /* Cho phép xuống dòng trên màn hình nhỏ */
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06);
    }

    .bank-info-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-grow: 1;
    }

    .bank-logo-wrapper {
      width: 108px;
      height: 108px;
      border-radius: 8px;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }

    .bank-logo {
      width: 100%;
      height: 100%;
      object-fit: contain; /* Dùng cover thay vì contain để lấp đầy */
    }

    .bank-details {
      display: flex;
      flex-direction: column;
    }

    .bank-name {
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
    }

    .masked-account {
      font-size: 0.875rem;
      color: #6b7280;
      font-family: "Menlo", "Courier New", monospace;
    }

    .account-holder-info {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      min-width: 150px; /* Đảm bảo có không gian */
    }

    .holder-label {
      font-size: 0.8rem;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .holder-name {
      font-size: 1rem;
      font-weight: 500;
      color: #111827;
    }

    .unlink-button {
      background-color:rgb(234, 13, 13); /* Màu đỏ */
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .unlink-button:hover {
      background-color: #dc2626; /* Đỏ đậm hơn */
    }

    /* --- Form liên kết ngân hàng --- */
    .bank-link-form {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06);
    }

    .form-description {
      font-size: 0.9rem;
      color: #6b7280;
      margin: 0 0 8px 0;
      text-align: center;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .form-input,
    .form-select {
      width: 100%;
      padding: 12px 14px;
      font-size: 0.9rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      box-sizing: border-box; /* Quan trọng */
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-input:focus,
    .form-select:focus {
      outline: none;
      border-color: #3b82f6; /* Màu xanh khi focus */
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    .link-button {
      background-color: #111827; /* Màu đen/than */
      color: white;
      font-weight: 600;
      font-size: 1rem;
      padding: 14px 20px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.2s ease;
      margin-top: 8px;
    }

    .link-button:hover {
      background-color: #374151;
    }

    .link-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }


    /* --- Lựa chọn thanh toán khác --- */
    .other-options-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
    }

    .option-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30px 30px;
      background:rgb(236, 244, 241);
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      transition: box-shadow 0.2s ease, border-color 0.2s ease;
      text-align: left;
      width: 100%;
      box-sizing: border-box;
    }

    .option-card:hover {
      border-color: #d1d5db;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07),
        0 2px 4px -1px rgba(0, 0, 0, 0.04);
    }

    .option-info {
      display: flex;
      align-items: center;
      gap: 14px;
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
    }

    .option-logo {
      height: 24px;
      object-fit: contain;
    }

    .arrow-icon {
      font-size: 1.5rem;
      font-weight: 300;
      color: #9ca3af;
      transition: transform 0.2s;
    }

    .option-card:hover .arrow-icon {
      transform: translateX(4px);
      color: #374151;
    }

    /* --- Modal (Styling từ code cũ, đã được tinh chỉnh) --- */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      padding: 28px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
      box-sizing: border-box;
    }

    .modal-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1a1a1a;
      margin-top: 0;
      margin-bottom: 12px;
    }

    .modal-text {
      color: #666;
      line-height: 1.6;
      margin-bottom: 24px;
      font-size: 0.95rem;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .modal-button-cancel {
      padding: 10px 20px;
      border-radius: 8px;
      border: 1px solid #d1d5db;
      background: #ffffff;
      color: #333;
      cursor: pointer;
      font-weight: 500;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    }

    .modal-button-cancel:hover {
      background: #f9fafb;
    }

    .modal-button-confirm {
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      background: #ef4444; /* Đỏ */
      color: white;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.9rem;
      transition: background-color 0.2s;
    }

    .modal-button-confirm:hover {
      background: #dc2626;
    }

    .modal-button-confirm:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* --- Responsive --- */
    @media (max-width: 600px) {
      .payment-content-wrapper {
        max-width: 100%;
      }
      .payment-page-title {
        font-size: 1.8rem;
      }
      .linked-bank-card {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }
      .account-holder-info {
        min-width: 0;
      }
      .unlink-button {
        width: 100%;
        text-align: center;
        padding: 12px;
      }
      .other-options-grid {
        grid-template-columns: 1fr; /* 1 cột trên mobile */
      }
    }
  `}</style>
);

// Định nghĩa kiểu cho bankData
interface BankData {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  // Thêm các trường khác nếu có
}

const BankLinkForm: React.FC = () => {
  // --- STATE VÀ LOGIC VỚI TYPESCRIPT ---
  const [userId, setUserId] = useState<string | null>(null);
  const [bankName, setBankName] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountHolder, setAccountHolder] = useState<string>("");
  const [linked, setLinked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [bankData, setBankData] = useState<BankData | null>(null);
  const [showUnlinkModal, setShowUnlinkModal] = useState<boolean>(false);

  useEffect(() => {
    // Kiểu 'user' có thể là 'any' hoặc một kiểu User cụ thể từ Firebase
    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      if (user) setUserId(user.uid);
      else setUserId(null);
    });
    return () => unsubscribe();
  }, []);

  const fetchBank = async (uid: string) => {
    try {
      setLoading(true);
      const res = await getBankByUser(uid);
      if (res?.linked && res.bank) {
        setLinked(true);
        setBankData(res.bank as BankData);
        setBankName(res.bank.bankName || "");
        setAccountNumber(res.bank.accountNumber || "");
        setAccountHolder(res.bank.accountHolder || "");
      } else {
        setLinked(false);
        setBankData(null);
        setBankName("");
        setAccountNumber("");
        setAccountHolder("");
      }
    } catch (err) {
      console.error("Error fetching bank:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) fetchBank(userId);
  }, [userId]);

  const handleLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Ngăn form submit
    if (!userId) return alert("User not found");
    if (!bankName || !accountNumber || !accountHolder)
      return alert("Vui lòng nhập đầy đủ thông tin!");
    try {
      setLoading(true);
      const res = await linkBank({ userId, bankName, accountNumber, accountHolder });
      alert(res.message || "Liên kết ngân hàng thành công!");
      await fetchBank(userId);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi liên kết ngân hàng!");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!userId) return alert("User not found");
    try {
      setLoading(true);
      const res = await unlinkBank(userId);
      alert(res.message || "Đã hủy liên kết!");
      await fetchBank(userId);
      setShowUnlinkModal(false);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi hủy liên kết!");
    } finally {
      setLoading(false);
    }
  };

  if (!userId && loading)
    return <div className="loading-container"><p>Đang tải thông tin người dùng...</p></div>;

  // --- GIAO DIỆN MỚI ---
  return (
    <div className="payment-page-container">
      <BankFormStyles /> {/* ✅ Thêm component CSS vào đây */}

      <div className="payment-content-wrapper">
        <h1 className="payment-page-title">💸 Sẵn sàng kết nối ngân hàng</h1>

        {/* --- Phần Tài khoản đã liên kết --- */}
        <h2 className="payment-section-title">Linked Bank Account</h2>
        {loading ? (
          <div className="loading-placeholder-card">Đang tải...</div>
        ) : linked && bankData ? (
          <div className="linked-bank-card">
            <div className="bank-info-left">
              <div className="bank-logo-wrapper">
                <img
                  src={getBankLogo(bankData.bankName)}
                  alt={`${bankData.bankName} logo`}
                  className="bank-logo"
                />
              </div>
              <div className="bank-details">
                <span className="bank-name">{bankData.bankName}</span>
                <span className="masked-account">
                  {maskAccountNumber(bankData.accountNumber)}
                </span>
              </div>
            </div>
            <div className="account-holder-info">
              <span className="holder-label">Account Holder</span>
              <span className="holder-name">{bankData.accountHolder}</span>
            </div>
            <button
              onClick={() => setShowUnlinkModal(true)}
              className="unlink-button"
            >
              Unlink Account
            </button>
          </div>
        ) : (
          // --- Form liên kết ngân hàng (khi chưa liên kết) ---
          <form className="bank-link-form" onSubmit={handleLink}>
            <p className="form-description">
              You don't have a bank account linked. Link one below.
            </p>
            <div className="form-group">
              <label htmlFor="bank-name" className="form-label">Tên ngân hàng</label>
              <select
                id="bank-name"
                className="form-select"
                value={bankName}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBankName(e.target.value)}
                required
              >
                <option value="" disabled>Chọn ngân hàng</option>
                {banks.map((b) => (
                  <option key={b.code} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="account-holder" className="form-label">Tên chủ tài khoản</label>
              <input
                id="account-holder"
                type="text"
                className="form-input"
                placeholder="Nhập tên chủ tài khoản"
                value={accountHolder}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccountHolder(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="account-number" className="form-label">Số tài khoản</label>
              <input
                id="account-number"
                type="text"
                className="form-input"
                placeholder="0000 0000 0000 0000"
                value={accountNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccountNumber(e.target.value.replace(/\s/g, ''))}
                required
              />
            </div>

            <button type="submit" className="link-button" disabled={loading}>
              {loading ? "Đang liên kết..." : "Link Bank Account"}
            </button>
          </form>
        )}

        {/* --- Phần Các lựa chọn thanh toán khác --- */}
         {/* --- 6 ví điện tử --- */}
         <h2 className="payment-section-title">Other Payment Options</h2>
        <div className="other-options-grid">
          {[
            { name: "PayPal", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" },
            { name: "Google Pay", logo: "https://tse3.mm.bing.net/th/id/OIP.qIcgNj_HeG45btJ_SYyxJgHaEe?rs=1&pid=ImgDetMain&o=7&rm=3" },
            { name: "Momo", logo: "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" },
            { name: "ZaloPay", logo: "https://tse2.mm.bing.net/th/id/OIP.2AN3trERL_NTN14qFGmfvQHaEd?rs=1&pid=ImgDetMain&o=7&rm=3" },
            { name: "ShopeePay", logo: "https://th.bing.com/th/id/OIP.GhsPnbuszM9OmN1NaXDz8AHaD3?w=333&h=180&c=7&r=0&o=7&dpr=1.6&pid=1.7&rm=3" },
            { name: "VNPay", logo: "data:image/webp;base64,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" },
            { name: "Apple Pay", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" },
            { name: "GrabPay", logo: "https://en.komoju.com/wp-content/uploads/2022/02/Grab-Pay-Logo.png" },
          ].map((wallet) => (
            <button key={wallet.name} className="option-card">
              <div className="option-info">
                <img src={wallet.logo} alt={wallet.name} className="option-logo" />
                <span>{wallet.name}</span>
              </div>
              <span className="arrow-icon">→</span>
            </button>
            ))}
        </div>
      </div>

      {/* --- Modal xác nhận hủy liên kết (Giữ nguyên logic) --- */}
      {showUnlinkModal && (
        <div className="modal-overlay" onClick={() => setShowUnlinkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Xác nhận hủy liên kết?</h3>
            <p className="modal-text">
              Bạn có chắc chắn muốn hủy liên kết tài khoản ngân hàng này? Bạn sẽ
              cần liên kết lại để thực hiện thanh toán trong tương lai.
            </p>
            <div className="modal-actions">
              <button
                onClick={() => setShowUnlinkModal(false)}
                className="modal-button-cancel"
              >
                Hủy
              </button>
              <button
                onClick={handleUnlink}
                disabled={loading}
                className="modal-button-confirm"
              >
                {loading ? "Đang xử lý..." : "Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BankLinkForm;