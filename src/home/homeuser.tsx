import { useState, useEffect } from "react";
import MenuBar from "./menu/MenuBar";

import SearchTrip from "./components/SearchTrip";
import Booking from "./components/Booking";
import Cart from "./components/Cart";
import Payment from "./components/Payment";
import Promotion from "./components/Promotion";
import Review from "./components/Review";
import Profile from "./components/Profile";
import Notification from "./components/Notification";

export default function HomeUser() {
  const [activeTab, setActiveTab] = useState("search");
  const [bgImage, setBgImage] = useState("");
  const [sideImages, setSideImages] = useState({ left: "", right: "" });

  useEffect(() => {
   // Chỉ giữ lại ảnh nền theo từng tab
const images: Record<string, { bg: string }> = {
  search: {
    bg: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1500&q=80"
  },
  booking: {
    bg: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1500&q=80"
  },
  cart: {
    bg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1500&q=80"
  },
  payment: {
    bg: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1500&q=80"
  },
  promotion: {
    bg: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1500&q=80"
  },
  review: {
    bg: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1500&q=80"
  },
  notification: {
    bg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1500&q=80"
  },
  profile: {
    bg: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1500&q=80"
  }
};

    
    const currentImages = images[activeTab];
setBgImage(currentImages.bg);
  }, [activeTab]);
  const renderComponent = () => {
    switch (activeTab) {
      case "search": return <SearchTrip />;
      case "booking": return <Booking />;
      case "cart": return <Cart />;
      case "payment": return <Payment />;
      case "promotion": return <Promotion />;
      case "review": return <Review />;
      case "notification": return <Notification />;
      case "profile": return <Profile />;
      default: return <SearchTrip />;
    }
  };

  return (
    <div className="homeuser-container">
      <style>{`
        * {
          box-sizing: border-box;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .homeuser-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 30%, #60a5fa 70%, #93c5fd 100%);
          font-family: 'Poppins', 'Segoe UI', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Floating vehicles animation */
        .floating-vehicle {
          position: absolute;
          width: 80px;
          height: 40px;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          animation: floatVehicle 30s linear infinite;
          z-index: 1;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
        }

        .floating-vehicle:nth-child(1) { 
          top: 10%; 
          left: -100px; 
          animation-delay: 0s;
          background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><rect x="10" y="15" width="80" height="25" rx="5" fill="%23ffffff" opacity="0.8"/><circle cx="25" cy="40" r="8" fill="%23ffffff" opacity="0.8"/><circle cx="75" cy="40" r="8" fill="%23ffffff" opacity="0.8"/><rect x="20" y="20" width="60" height="15" rx="3" fill="%23e0f2fe" opacity="0.6"/></svg>');
        }
        .floating-vehicle:nth-child(2) { 
          top: 30%; 
          right: -100px; 
          animation-delay: 7s;
          background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><rect x="15" y="20" width="70" height="20" rx="5" fill="%23ffffff" opacity="0.8"/><circle cx="30" cy="42" r="7" fill="%23ffffff" opacity="0.8"/><circle cx="70" cy="42" r="7" fill="%23ffffff" opacity="0.8"/><rect x="25" y="25" width="50" height="10" rx="2" fill="%23e0f2fe" opacity="0.6"/></svg>');
        }
        .floating-vehicle:nth-child(3) { 
          top: 60%; 
          left: -100px; 
          animation-delay: 14s;
          background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><rect x="12" y="18" width="76" height="22" rx="6" fill="%23ffffff" opacity="0.8"/><circle cx="28" cy="42" r="8" fill="%23ffffff" opacity="0.8"/><circle cx="72" cy="42" r="8" fill="%23ffffff" opacity="0.8"/><rect x="22" y="23" width="56" height="12" rx="3" fill="%23e0f2fe" opacity="0.6"/></svg>');
        }
        .floating-vehicle:nth-child(4) { 
          top: 80%; 
          right: -100px; 
          animation-delay: 21s;
          background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><rect x="8" y="16" width="84" height="28" rx="7" fill="%23ffffff" opacity="0.8"/><circle cx="26" cy="46" r="9" fill="%23ffffff" opacity="0.8"/><circle cx="74" cy="46" r="9" fill="%23ffffff" opacity="0.8"/><rect x="18" y="21" width="64" height="18" rx="4" fill="%23e0f2fe" opacity="0.6"/></svg>');
        }

        @keyframes floatVehicle {
          0% { transform: translateX(0) rotate(0deg) scale(1); }
          25% { transform: translateX(calc(25vw + 25px)) rotate(2deg) scale(1.05); }
          50% { transform: translateX(calc(50vw + 50px)) rotate(0deg) scale(1.1); }
          75% { transform: translateX(calc(75vw + 75px)) rotate(-2deg) scale(1.05); }
          100% { transform: translateX(calc(100vw + 100px)) rotate(0deg) scale(1); }
        }

        /* Nền động với parallax effect */
        .background-layers {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
        }

        .background-layer {
          position: absolute;
          width: 120%;
          height: 120%;
          background-size: cover;
          background-position: center;
          opacity: 0.3;
          filter: blur(4px) brightness(1.2) saturate(1.3);
          animation: parallaxBg 40s linear infinite alternate;
        }

        .background-layer:nth-child(2) {
          animation-duration: 50s;
          opacity: 0.2;
          filter: blur(6px) brightness(1.1) saturate(1.1);
        }

        @keyframes parallaxBg {
          0% { transform: translate(-50px, -30px) scale(1.1); }
          100% { transform: translate(50px, 30px) scale(1.15); }
        }

        /* Side images container */
        .side-images-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .side-image {
          position: absolute;
          width: 300px;
          height: 400px;
          border-radius: 20px;
          background-size: cover;
          background-position: center;
          box-shadow: 
            0 20px 40px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          animation: floatSideImage 8s ease-in-out infinite;
        }

        .side-image.left {
          left: -150px;
          top: 50%;
          transform: translateY(-50%) rotate(-15deg);
          animation-delay: 0s;
        }

        .side-image.right {
          right: -150px;
          top: 50%;
          transform: translateY(-50%) rotate(15deg);
          animation-delay: 4s;
        }

        @keyframes floatSideImage {
          0%, 100% { transform: translateY(-50%) rotate(var(--rotation, 0deg)) scale(1); }
          50% { transform: translateY(-60%) rotate(var(--rotation, 0deg)) scale(1.05); }
        }

        .side-image.left { --rotation: -15deg; }
        .side-image.right { --rotation: 15deg; }

        header {
          background: linear-gradient(135deg, rgba(30, 64, 175, 0.9), rgba(59, 130, 246, 0.8), rgba(96, 165, 250, 0.9));
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 25px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 8px 32px rgba(30, 64, 175, 0.3);
          border-radius: 0 0 30px 30px;
          margin: 0 20px;
          margin-top: 20px;
          z-index: 10;
          position: relative;
          overflow: hidden;
        }

        /* Animated header background */
        header::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1500&q=80");
          background-size: cover;
          background-position: center;
          opacity: 0.15;
          animation: headerBgMove 20s ease-in-out infinite alternate;
          z-index: -1;
        }

        @keyframes headerBgMove {
          0% { transform: scale(1.1) translateX(-10px); }
          100% { transform: scale(1.15) translateX(10px); }
        }

        header::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20"><path d="M0,10 Q25,0 50,10 T100,10 L100,20 L0,20 Z" fill="%23ffffff" opacity="0.05"/></svg>') repeat-x;
          background-size: 100px 20px;
          border-radius: 0 0 30px 30px;
        }

        header h1 {
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: 2px;
          display: flex;
          align-items: center;
          gap: 15px;
          text-shadow: 2px 2px 8px rgba(0,0,0,0.3);
          position: relative;
          z-index: 2;
        }

        header h1::before {
          content: "🚌";
          font-size: 2rem;
          animation: bounceBus 2s ease-in-out infinite;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
        }

        @keyframes bounceBus {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          25% { transform: translateY(-4px) rotate(2deg) scale(1.05); }
          50% { transform: translateY(-8px) rotate(0deg) scale(1.1); }
          75% { transform: translateY(-4px) rotate(-2deg) scale(1.05); }
        }

        .help-btn {
          background: linear-gradient(45deg, #ffffff, #f0f9ff);
          color: #1e40af;
          border: 2px solid rgba(255,255,255,0.3);
          padding: 12px 25px;
          border-radius: 50px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(30, 64, 175, 0.3);
          position: relative;
          z-index: 2;
          overflow: hidden;
        }

        .help-btn::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.5s;
        }

        .help-btn:hover::before {
          left: 100%;
        }

        .help-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(30, 64, 175, 0.5);
          background: linear-gradient(45deg, #f0f9ff, #ffffff);
        }
main {
  flex: 1;
  background: transparent !important;
  backdrop-filter: none !important;
  
  border-radius: 0 !important;
  padding: 50px;
  width: 100% !important;
  max-width: 3000px;
  box-shadow: none !important;
  position: relative;
  z-index: 2;
  animation: slideInUp 0.8s ease-out;
  border: none !important;
}


  main::before {
  opacity: 0 !important;
}


        @keyframes slideInUp {
          from { 
            opacity: 0; 
            transform: translateY(60px) scale(0.95); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }

        /* --- Nội dung file Footer.css --- */

.footer-wrapper {
  background-color:rgba(2, 1, 11, 1); /* Màu nền xám nhạt */
  padding-top: 40px;
  color: #FFFFFF;
  border-top: 1px solid #eee;
}

.footer-container {
  max-width: 1500px;
  margin: 0 auto; /* Căn giữa */
  padding: 0 20px;
}

/* Đây là phần quan trọng nhất - Chia cột */
.footer-main-content {
  display: flex;
  flex-wrap: wrap; /* Cho phép xuống hàng trên điện thoại */
  justify-content: space-between;
  gap: 30px; /* Khoảng cách giữa các cột */
  border-bottom: 1px solid #ddd;
  padding-bottom: 30px;
}

.footer-section {
  flex: 1; /* Các cột tự động chia đều */
  min-width: 200px; /* Độ rộng tối thiểu cho mỗi cột */
}

.footer-section h4 {
  margin-bottom: 15px;
  color: #FFFFF;
}

.footer-section p {
  margin: 5px 0;
  line-height: 1.6;
}

/* Định dạng cho danh sách liên kết */
.footer-section ul {
  list-style: none;
  padding: 0;
}

.footer-section ul li {
  margin-bottom: 10px;
}

.footer-section ul li a {
  text-decoration: none;
  color:rgb(228, 226, 240); /* Màu link */
  transition: color 0.2s;
}

.footer-section ul li a:hover {
  color:rgb(200, 14, 14); /* Màu link khi rê chuột */
  text-decoration: underline;
}

/* Các icon thanh toán */
.payment-icons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.payment-icons img {
  height: 30px;
  border: 1px solid #eee;
  border-radius: 4px;
}

/* Các link tải app */
.app-links {
  display: flex;
  flex-direction: column; /* Xếp dọc */
  gap: 10px;
  margin-bottom: 20px;
}

.app-links img {
  height: 40px;
  width: auto;
}

/* Các link mạng xã hội */
.social-links {
  display: flex;
  gap: 15px;
}

.social-links a {
  text-decoration: none;
  color: #007bff;
  font-weight: 500;
}

/* Phần bản quyền (dưới cùng) */
.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; /* Xuống hàng nếu không đủ chỗ */
  padding: 20px 0;
  gap: 15px;
  font-size: 14px;
}

.bct-logo img {
  height: 50px;
}


        /* Floating particles */
        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: rgba(255,255,255,0.7);
          border-radius: 50%;
          animation: floatParticle 8s ease-in-out infinite;
          box-shadow: 0 0 10px rgba(255,255,255,0.5);
        }

        .particle:nth-child(1) { top: 20%; left: 10%; animation-delay: 0s; }
        .particle:nth-child(2) { top: 40%; left: 20%; animation-delay: 1.5s; }
        .particle:nth-child(3) { top: 60%; left: 80%; animation-delay: 3s; }
        .particle:nth-child(4) { top: 80%; left: 70%; animation-delay: 4.5s; }
        .particle:nth-child(5) { top: 30%; left: 90%; animation-delay: 6s; }

        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.7; }
          50% { transform: translateY(-30px) scale(1.3); opacity: 1; }
        }

        /* Glow effects */
        .glow-effect {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 30%, rgba(200, 202, 209, 0.2), transparent 60%),
            radial-gradient(circle at 80% 70%, rgba(59, 130, 246,0.2), transparent 60%),
            radial-gradient(circle at 50% 50%, rgba(96, 165, 250,0.15), transparent 70%);
          filter: blur(100px);
          z-index: 1;
          pointer-events: none;
          animation: pulseGlow 12s infinite alternate;
        }

        @keyframes pulseGlow {
          from { opacity: 0.6; transform: scale(1); }
          to { opacity: 1; transform: scale(1.1); }
        }

        /* Road lines animation */
        .road-lines {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }

        .road-line {
          position: absolute;
          width: 4px;
          height: 60px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.6), transparent);
          animation: roadLineMove 3s linear infinite;
        }

        .road-line:nth-child(1) { left: 20%; animation-delay: 0s; }
        .road-line:nth-child(2) { left: 40%; animation-delay: 0.5s; }
        .road-line:nth-child(3) { left: 60%; animation-delay: 1s; }
        .road-line:nth-child(4) { left: 80%; animation-delay: 1.5s; }

        @keyframes roadLineMove {
          0% { transform: translateY(-100vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }

        /* Speedometer effect */
        .speedometer {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, #1e40af 0deg, #3b82f6 120deg, #60a5fa 240deg, #93c5fd 360deg);
          z-index: 5;
          animation: speedometerSpin 4s linear infinite;
          box-shadow: 0 4px 20px rgba(30, 64, 175, 0.3);
        }

        .speedometer::before {
          content: "🚌";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 24px;
          animation: speedometerIcon 2s ease-in-out infinite alternate;
        }

        @keyframes speedometerSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes speedometerIcon {
          0% { transform: translate(-50%, -50%) scale(1); }
          100% { transform: translate(-50%, -50%) scale(1.2); }
        }

        /* Traffic lights */
        .traffic-light {
          position: fixed;
          top: 50%;
          left: 20px;
          width: 20px;
          height: 60px;
          background: linear-gradient(to bottom, #ef4444 0%, #ef4444 33%, #f59e0b 33%, #f59e0b 66%, #10b981 66%, #10b981 100%);
          border-radius: 10px;
          z-index: 5;
          animation: trafficLightBlink 3s ease-in-out infinite;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }

        @keyframes trafficLightBlink {
          0%, 33% { filter: brightness(1); }
          34%, 66% { filter: brightness(0.3); }
          67%, 100% { filter: brightness(1); }
        }

        /* Responsive design */
        @media (max-width: 768px) {
          header {
            margin: 0 10px;
            padding: 20px;
          }
          
          header h1 {
            font-size: 1.8rem;
          }
          
          main {
            margin: 20px auto;
            padding: 30px 20px;
            width: 95%;
          }

          .side-image {
            width: 200px;
            height: 250px;
          }

          .side-image.left {
            left: -100px;
          }

          .side-image.right {
            right: -100px;
          }

          .speedometer {
            width: 60px;
            height: 60px;
            top: 15px;
            right: 15px;
          }

          .speedometer::before {
            font-size: 18px;
          }

          .traffic-light {
            width: 15px;
            height: 45px;
            left: 15px;
          }
        }
        /* Floating buses animation */
        .floating-bus {
          position: absolute;
          width: 120px;
          height: 60px;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          animation: floatBus 20s linear infinite;
          z-index: 2;
          filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4));
        }

        .floating-bus:nth-child(1) { 
          top: 10%; 
          left: -150px; 
          animation-delay: 0s;
          background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><rect x="10" y="15" width="100" height="30" rx="8" fill="%23ffffff" opacity="0.9"/><circle cx="30" cy="50" r="10" fill="%23ffffff" opacity="0.9"/><circle cx="90" cy="50" r="10" fill="%23ffffff" opacity="0.9"/><rect x="20" y="20" width="80" height="20" rx="4" fill="%23e0f2fe" opacity="0.7"/><rect x="25" y="25" width="70" height="10" rx="2" fill="%23ffffff" opacity="0.8"/><circle cx="40" cy="30" r="3" fill="%231e40af" opacity="0.6"/><circle cx="80" cy="30" r="3" fill="%231e40af" opacity="0.6"/></svg>');
        }
        .floating-bus:nth-child(2) { 
          top: 30%; 
          right: -150px; 
          animation-delay: 5s;
          background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><rect x="15" y="20" width="90" height="25" rx="6" fill="%23ffffff" opacity="0.9"/><circle cx="35" cy="50" r="9" fill="%23ffffff" opacity="0.9"/><circle cx="85" cy="50" r="9" fill="%23ffffff" opacity="0.9"/><rect x="25" y="25" width="70" height="15" rx="3" fill="%23e0f2fe" opacity="0.7"/><rect x="30" y="30" width="60" height="8" rx="2" fill="%23ffffff" opacity="0.8"/><circle cx="45" cy="34" r="2" fill="%231e40af" opacity="0.6"/><circle cx="75" cy="34" r="2" fill="%231e40af" opacity="0.6"/></svg>');
        }
        .floating-bus:nth-child(3) { 
          top: 60%; 
          left: -150px; 
          animation-delay: 10s;
          background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><rect x="12" y="18" width="96" height="27" rx="7" fill="%23ffffff" opacity="0.9"/><circle cx="32" cy="50" r="11" fill="%23ffffff" opacity="0.9"/><circle cx="88" cy="50" r="11" fill="%23ffffff" opacity="0.9"/><rect x="22" y="23" width="76" height="17" rx="4" fill="%23e0f2fe" opacity="0.7"/><rect x="27" y="28" width="66" height="12" rx="3" fill="%23ffffff" opacity="0.8"/><circle cx="42" cy="34" r="3" fill="%231e40af" opacity="0.6"/><circle cx="78" cy="34" r="3" fill="%231e40af" opacity="0.6"/></svg>');
        }
        .floating-bus:nth-child(4) { 
          top: 80%; 
          right: -150px; 
          animation-delay: 15s;
          background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><rect x="8" y="16" width="104" height="33" rx="8" fill="%23ffffff" opacity="0.9"/><circle cx="30" cy="52" r="12" fill="%23ffffff" opacity="0.9"/><circle cx="90" cy="52" r="12" fill="%23ffffff" opacity="0.9"/><rect x="18" y="21" width="84" height="23" rx="5" fill="%23e0f2fe" opacity="0.7"/><rect x="23" y="26" width="74" height="13" rx="3" fill="%23ffffff" opacity="0.8"/><circle cx="38" cy="32" r="3" fill="%231e40af" opacity="0.6"/><circle cx="82" cy="32" r="3" fill="%231e40af" opacity="0.6"/></svg>');
        }

        @keyframes floatBus {
          0% { transform: translateX(0) rotate(0deg) scale(1); }
          20% { transform: translateX(calc(20vw + 20px)) rotate(1deg) scale(1.02); }
          40% { transform: translateX(calc(40vw + 40px)) rotate(0deg) scale(1.05); }
          60% { transform: translateX(calc(60vw + 60px)) rotate(-1deg) scale(1.08); }
          80% { transform: translateX(calc(80vw + 80px)) rotate(0deg) scale(1.05); }
          100% { transform: translateX(calc(100vw + 100px)) rotate(0deg) scale(1); }
        }

        /* Road lines animation */
        .road-lines {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }

        .road-line {
          position: absolute;
          width: 6px;
          height: 80px;
          background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.8), transparent);
          animation: roadLineMove 2.5s linear infinite;
          border-radius: 3px;
        }

        .road-line:nth-child(1) { left: 15%; animation-delay: 0s; }
        .road-line:nth-child(2) { left: 35%; animation-delay: 0.3s; }
        .road-line:nth-child(3) { left: 55%; animation-delay: 0.6s; }
        .road-line:nth-child(4) { left: 75%; animation-delay: 0.9s; }
        .road-line:nth-child(5) { left: 95%; animation-delay: 1.2s; }

        @keyframes roadLineMove {
          0% { transform: translateY(-100vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(100vh); opacity: 0; }
        }

        /* Speedometer effect */
        .speedometer {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: conic-gradient(from 0deg, #1e40af 0deg, #3b82f6 120deg, #60a5fa 240deg, #93c5fd 360deg);
          z-index: 8;
          animation: speedometerSpin 3s linear infinite;
          box-shadow: 0 6px 25px rgba(30, 64, 175, 0.4);
        }

        .speedometer::before {
          content: "🚌";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 28px;
          animation: speedometerIcon 1.5s ease-in-out infinite alternate;
        }

        @keyframes speedometerSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes speedometerIcon {
          0% { transform: translate(-50%, -50%) scale(1); }
          100% { transform: translate(-50%, -50%) scale(1.3); }
        }

        /* Traffic lights */
        .traffic-light {
          position: fixed;
          top: 50%;
          left: 20px;
          width: 25px;
          height: 75px;
          background: linear-gradient(to bottom, #ef4444 0%, #ef4444 33%, #f59e0b 33%, #f59e0b 66%, #10b981 66%, #10b981 100%);
          border-radius: 12px;
          z-index: 8;
          animation: trafficLightBlink 2.5s ease-in-out infinite;
          box-shadow: 0 6px 20px rgba(0,0,0,0.4);
        }

        @keyframes trafficLightBlink {
          0%, 40% { filter: brightness(1); }
          41%, 60% { filter: brightness(0.3); }
          61%, 100% { filter: brightness(1); }
        }

        /* Floating particles */
        .particle {
          position: absolute;
          width: 8px;
          height: 8px;
          background: rgba(255,255,255,0.8);
          border-radius: 50%;
          animation: floatParticle 6s ease-in-out infinite;
          box-shadow: 0 0 15px rgba(255,255,255,0.6);
        }

        .particle:nth-child(1) { top: 15%; left: 10%; animation-delay: 0s; }
        .particle:nth-child(2) { top: 35%; left: 25%; animation-delay: 1s; }
        .particle:nth-child(3) { top: 65%; left: 75%; animation-delay: 2s; }
        .particle:nth-child(4) { top: 85%; left: 60%; animation-delay: 3s; }
        .particle:nth-child(5) { top: 25%; left: 90%; animation-delay: 4s; }

        @keyframes floatParticle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
          50% { transform: translateY(-40px) scale(1.4); opacity: 1; }
        }

        /* Enhanced header with animated background */
header {
  width: 100vw; /* Tràn toàn màn hình */
  background: linear-gradient(
    135deg,
    rgba(30, 64, 175, 0.95),
    rgba(59, 130, 246, 0.9),
    rgba(96, 165, 250, 0.95)
  );
  backdrop-filter: blur(25px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 60px;
  margin: 0;                 /* Bỏ khoảng cách hai bên */
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
  border-left: 2px solid rgba(255, 255, 255, 0.2); /* Giữ viền trái */
  border-right: none;        /* Bỏ viền phải */
  border-radius: 0;          /* Bỏ bo góc */
  box-shadow: 0 15px 60px rgba(0, 0, 0, 0.5);
  position: relative;
  left: 0;
  top: 0;
  z-index: 10;
  overflow: hidden;
}

header::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1500&q=80");
  background-size: cover;
  background-position: center;
  opacity: 0.3;
  animation: headerBgMove 15s ease-in-out infinite alternate;
  z-index: -1;
}

@keyframes headerBgMove {
  0% {
    background-position: left center;
  }
  100% {
    background-position: right center;
  }
}

      `}</style>

      {/* Floating vehicles */}
      <div className="floating-vehicle"></div>
      <div className="floating-vehicle"></div>
      <div className="floating-vehicle"></div>
      <div className="floating-vehicle"></div>

      {/* Floating particles */}
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>

      {/* Ảnh nền động với parallax */}
      <div className="background-layers">
        <div className="background-layer" style={{ backgroundImage: `url(${bgImage})` }}></div>
        <div className="background-layer" style={{ backgroundImage: `url(${bgImage})` }}></div>
      </div>

      

      {/* Floating buses */}
      <div className="floating-bus"></div>
      <div className="floating-bus"></div>
      <div className="floating-bus"></div>
      <div className="floating-bus"></div>

      {/* Road lines */}
      <div className="road-lines">
        <div className="road-line"></div>
        <div className="road-line"></div>
        <div className="road-line"></div>
        <div className="road-line"></div>
        <div className="road-line"></div>
      </div>

      {/* Speedometer */}
      <div className="speedometer"></div>

      {/* Traffic light */}
      <div className="traffic-light"></div>

      {/* Floating particles */}
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>

      <div className="glow-effect"></div>

      {/* Header */}
        <header>
          <h1>Vé Online</h1>
          <button className="help-btn">Trợ giúp</button>
        </header>

      {/* Menu */}
      <MenuBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Nội dung */}
      <main>{renderComponent()}</main>

      {/* Footer */}
      <div className="footer-wrapper">
      <footer className="footer-container">
        
        {/* Phần nội dung chính của footer (chia cột) */}
        <div className="footer-main-content">

          {/* Cột 1: Thông tin chung & Logo */}
          <div className="footer-section">
          <img 
  src="https://i.fbcd.co/products/resized/resized-750-500/ex-xe-unique-logo-designs-2-cbd6a550a2914ecce39886496ac239ae46c1fa8b2de4f4372f4a20cfd7121789.jpg" 
  alt="Logo Vé Xe Online" 
  style={{
    width: '100px',       // 👈 kích thước ngang
    height: 'auto',       // tự điều chỉnh theo tỉ lệ
    marginBottom: '15px',
    borderRadius: '8px',  // bo góc nhẹ (nếu muốn)
  }} 
/>

            <p><strong>Công ty TNHH Vé Xe Online Việt Nam</strong></p>
            <p>Địa chỉ: 123 Đường ABC, Phường X, Quận Y, TP. Hồ Chí Minh</p>
            <p>Hotline: <strong>1900 0000</strong></p>
            <p>Email: hotro@vexeonline.vn</p>
          </div>

          {/* Cột 2: Liên kết hữu ích */}
          <div className="footer-section">
            <h4>Về chúng tôi</h4>
            <ul>
              <li><a href="/about">Giới thiệu</a></li>
              <li><a href="/faq">Câu hỏi thường gặp</a></li>
              <li><a href="/terms">Điều khoản sử dụng</a></li>
              <li><a href="/policy">Chính sách bảo mật</a></li>
            </ul>
          </div>

          {/* Cột 3: Thanh toán */}
          <div className="footer-section">
            <h4>Phương thức thanh toán</h4>
            <div className="payment-icons">
              {/* Thay bằng URL/src hình ảnh thật */}
              <img src="data:image/webp;base64,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" alt="Visa" />
              <img src="data:image/webp;base64,UklGRogFAABXRUJQVlA4IHwFAACwLgCdASopASkBPp1OpE0lpCOiItKYSLATiWdu4XPxEa7XrNGzVB8Nym2/0YR73zX5GfUx4qvSS8xf7O+sB6a/8P6kH9V6m30Jelj/cv9wPZj1UL0BvO149xTsBlmcDNN5PNd9F9CGgBt2QVS6qfFCzbsgql1U+KFm3ZBVLqp8ULNuyCqXVT4oWbdkFUuqnxQs27IKpdVPihZt2QVMgCthjziZA8bFr7n4vJT+GQXYTEMaZw40CEMpqp6bEtlC7ctLoVZrzHm3/xkSlNfpOgJ5lNUnB2u1+ExzxD7iQrvmBUBvc5yPwoWbG6S6vTZKJp4BuC1Yi/GdAtwoWbHYK6/wF0h7FOFdPwSemyD1NKn6jD94gNu3NL+e5BsKHUr+eoedPYUj2o9b7iVObp7UuJc2Y5YbzilQQCvY1Jba34tYyOGeC+Hd3Dj6apdVPiiRlO6g27IKpdVPihZt2QVS6qfFCzbsgql1U+KFm3ZBVLqp8ULNuyCqXVT4oWbdkFS4AP7/JzAAAAAAACp66xGgRXeEvrU4MehGfjsLzW3ilREFEep7D946YKI2T2KbcvqS990vtgXC7Dp9jTo6j80Zd5xltLkvYlhzgGZD28hc98qglDq2hGM/lfvxHTmSM9+KYlkmJl4DTGuJrLsIj4t9Btj1PYxZhl0Vn3ehIDPi5leW9psxPNqly8rq1KWI0gRbGiK4MrxbuJV6LU9AhzSuWjXRuaStehKW2Ox899XsP9T7vYggpKsxGmLg37SD7ixB8iTqDixxFCr/CaV6iCAormV3Y84Yv+1lFRprp970U4eQlxnbt3jx0158/csTZzSQL22ZtwuxDtjPOdefZBIFU+nUgUo7epzX3Vacq7F77qJGTuQzFlTNU8EFb5uIyfzfStLfHuUQ6bFw3zVEU9f8Tt+v+YMU+6ygBNCV+9ynofBHp2n+sAUoJt2sGw0a5VAdgyFACNY7bIxPaKBe6RUgcY4mSo/eZQFAH8meZCYUbil4/qSz7KpRNkEkpyuzC3Fr15n8OBZp3TIme1KKl5RUK0VVsNKN7jQdylMWT1/HGOcBITFUxD5VU5FSVwYYF7WvzaINJIztvTgHuXfg2L6Gn74KEaFGAVWlAzph2AiRyfUPqWJPzd0XiQ9qeCqjo3eblfM0K8Jinab3kHk5I0ow0+35Hq2HKfu9EMP5lbYkX67rh/Fslo8TF+F4o24KV2ds2UAmwoOieixvNmSVUzN3KeziIRztNq+hgWP2VV+0y/THI6HDtwnO8v0MZbDGhAaUHQhW7vdddk1acNBS/k3l/VEyN7EFFtilNBCPOqNgk5d+WQDx9DdAa9uUAfT48LrO9K7bKWEx70nd55Se08xn3cBXok2kSssEyWmyOGtZ7sqUFpM0ML+E9mkUK6DhRBzc1E7Dhg+WWiLLaZpvNwpml+anSnTIiIEUVOUrVaGgtDLFSbNAS5B58wuy25xaoo/+XVn2orq+Ayf3YjqjlK+KnlGVBtLVMnbXMFYDnjn5qOF+kpZwGqhz6giUjJjJMVWVrh7VkUZ8C/AHzeXnueYDuhrgskt+OpkBfFHjw0gZQTtnaI6dqXaZS/29TcP4Z7loQ4WKhsrLLAvxC4joZUZC3F4+gVJXswk7JhZqKeK2eOw/XXO2MZF9G5nKfzWxL2DaQNsf5zW/WBFy0jFs2+zKOhCCx5VpKDSWlm8NSaE8mLAHBt1u7UJbp2YFEwfx2Rebm4lO3uxtYklNoh3EmlfPl8ueVISAfQP4lTe+fVp8Tw2+vGF2noJq2Z9xNxpSYGYTzCXMN/aNK5CTk/7hHu1dcLCz/J9tNENrv9Z9safJHvNQrCbm/dZ3QBQmyxtfveDasvmxxAXAAAAAAAAAAAA=" alt="Mastercard" />
              <img src="https://th.bing.com/th?id=OIF.aq7qEeR3hBHa3%2f35JrKeBQ&rs=1&pid=ImgDetMain&o=7&rm=3" alt="JCB" />
              <img src="https://tse4.mm.bing.net/th/id/OIP.1GNvjAZu4hlbE0bWflshGwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" alt="Momo" />
              <img src="https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418196384.png" alt="VNPay" />
              <img src="https://tse4.mm.bing.net/th/id/OIP.dqBGQAVmIM35FLHSndWGLwHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" alt="ZaloPay" />
            </div>
          </div>

          {/* Cột 4: Tải ứng dụng & Mạng xã hội */}
          <div className="footer-section">
            <h4>Tải ứng dụng</h4>
            <div className="app-links">
              <a href="#appstore"><img src="https://logos-world.net/wp-content/uploads/2021/02/App-Store-Logo-2017-present.jpg" alt="Download on the App Store" /></a>
              <a href="#googleplay"><img src="https://tse3.mm.bing.net/th/id/OIP.YnbMwzlTZYXnaG16-rZzSgHaHa?pid=ImgDet&w=474&h=474&rs=1&o=7&rm=3" alt="Get it on Google Play" /></a>
            </div>
            
            <h4>Kết nối với chúng tôi</h4>
            <div className="social-links">
              <a href="#facebook">Facebook</a>
              <a href="#zalo">Zalo</a>
              <a href="#youtube">YouTube</a>
            </div>
          </div>

        </div>

        {/* Phần bản quyền (dưới cùng) */}
        <div className="footer-bottom">
          <div className="copyright">
            © 2025 Vé Xe Online — Trải nghiệm đặt vé dễ dàng & nhanh chóng
          </div>
          <div className="bct-logo">
            <a href="#bct-link">
            <img 
  src="https://i.fbcd.co/products/resized/resized-750-500/ex-xe-unique-logo-designs-2-cbd6a550a2914ecce39886496ac239ae46c1fa8b2de4f4372f4a20cfd7121789.jpg" 
  alt="Đã thông báo bộ công thương " 
  style={{
    width: '100px',       // 👈 kích thước ngang
    height: 'auto',       // tự điều chỉnh theo tỉ lệ
    marginBottom: '15px',
    borderRadius: '8px',  // bo góc nhẹ (nếu muốn)
  }} 
/>

            </a>
          </div>
        </div>
      </footer>
    </div>
    </div>
  );
}
