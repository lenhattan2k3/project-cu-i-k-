import {
  FaSearch,
  FaTicketAlt,
  FaShoppingCart,
  FaCreditCard,
  FaGift,
  FaStar,
  FaBell,
  FaUser,
} from "react-icons/fa";
import { FiFileText } from "react-icons/fi";

interface MenuBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function MenuBar({ activeTab, setActiveTab }: MenuBarProps) {
  const menuItems = [
    { id: "search", icon: <FaSearch />, label: "Tìm chuyến" },
    { id: "booking", icon: <FaTicketAlt />, label: "Đặt vé" },
    { id: "cart", icon: <FaShoppingCart />, label: " Vé" },
    { id: "payment", icon: <FaCreditCard />, label: "Thanh toán" },
    { id: "invoices", icon: <FiFileText />, label: "Hóa đơn" },
    { id: "promotion", icon: <FaGift />, label: "Khuyến mãi" },
    { id: "review", icon: <FaStar />, label: "Đánh giá" },
    { id: "notification", icon: <FaBell />, label: "Thông báo" },
    { id: "profile", icon: <FaUser />, label: "Tài khoản" },
  ];

  return (
    <div className="menu-container">
      {/* Lớp nền ánh sáng di chuyển dưới thanh menu */}
      <div className="moving-light"></div>

      {/* Thanh menu chính */}
      <div className="menu-bar">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`menu-item ${activeTab === item.id ? "active" : ""}`}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        .menu-container {
          position: sticky;
          top: 0;
          z-index: 1000;
          height: 120px;
          background: linear-gradient(135deg, #1e40af, #2563eb, #60a5fa);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
          overflow: hidden;
          border-bottom-left-radius: 25px;
          border-bottom-right-radius: 25px;
        }

        /* Lớp ánh sáng chuyển động phía dưới */
        .moving-light {
          position: absolute;
          bottom: -30px;
          left: 50%;
          width: 300px;
          height: 80px;
          background: radial-gradient(
            ellipse at center,
            rgba(255, 255, 255, 0.35) 0%,
            rgba(255, 255, 255, 0) 80%
          );
          transform: translateX(-50%);
          filter: blur(25px);
          animation: moveLight 8s infinite linear;
        }

        @keyframes moveLight {
          0% { transform: translateX(-60%) scale(1); }
          50% { transform: translateX(60%) scale(1.2); }
          100% { transform: translateX(-60%) scale(1); }
        }

        .menu-bar {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 90px;
          height: 100%;
          color: white;
          z-index: 2;
          backdrop-filter: blur(8px);
        }

        .menu-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: white;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .menu-item .icon {
          font-size: 2rem;
          margin-bottom: 3px;
          transition: transform 0.3s ease, color 0.3s ease;
        }

        .menu-item:hover .icon {
          transform: scale(1.25) translateY(-3px);
          color: #fde68a;
        }

        .menu-item:hover .label {
          color: #fde68a;
        }

        .menu-item.active {
          color: #fef08a;
          transform: translateY(-4px);
        }

        .menu-item.active .icon {
          color: #facc15;
          transform: scale(1.3) translateY(-4px);
          filter: drop-shadow(0 0 10px rgba(250, 204, 21, 0.7));
        }

        /* Hiệu ứng ánh sáng cho item đang chọn */
        .menu-item.active::after {
          content: "";
          position: absolute;
          bottom: -10px;
          left: 50%;
          width: 30px;
          height: 3px;
          border-radius: 2px;
          background: linear-gradient(90deg, #fde68a, #facc15, #fde68a);
          transform: translateX(-50%);
          animation: glowLine 2s ease-in-out infinite;
        }

        @keyframes glowLine {
          0%, 100% { opacity: 0.5; width: 30px; }
          50% { opacity: 1; width: 50px; }
        }

        .label {
          font-weight: 500;
          font-size: 0.85rem;
          transition: color 0.3s ease;
        }
      `}</style>
    </div>
  );
}
