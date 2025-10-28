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
    // Thay ảnh nền và ảnh 2 bên tùy theo tab đang chọn - Tập trung vào xe khách
    const images: Record<string, { bg: string; left: string; right: string }> = {
      search: {
        bg: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1500&q=80",
        left: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80",
        right: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80"
      },
      booking: {
        bg: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1500&q=80",
        left: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
        right: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80"
      },
      cart: {
        bg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1500&q=80",
        left: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=800&q=80",
        right: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"
      },
      payment: {
        bg: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1500&q=80",
        left: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
        right: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=800&q=80"
      },
      promotion: {
        bg: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1500&q=80",
        left: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80",
        right: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80"
      },
      review: {
        bg: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1500&q=80",
        left: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80",
        right: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=800&q=80"
      },
      notification: {
        bg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1500&q=80",
        left: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=800&q=80",
        right: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"
      },
      profile: {
        bg: "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1500&q=80",
        left: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
        right: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=800&q=80"
      },
    };
    
    const currentImages = images[activeTab];
    setBgImage(currentImages.bg);
    setSideImages({ left: currentImages.left, right: currentImages.right });
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
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(25px);
          margin: 30px auto;
          border-radius: 30px;
          padding: 50px;
          width: 90%;
          max-width: 1200px;
          box-shadow: 
            0 25px 50px rgba(0,0,0,0.15),
            0 0 0 1px rgba(255,255,255,0.2),
            inset 0 1px 0 rgba(255,255,255,0.3);
          position: relative;
          z-index: 2;
          animation: slideInUp 0.8s ease-out;
          border: 1px solid rgba(255,255,255,0.3);
        }

        main::before {
          content: "";
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c);
          border-radius: 32px;
          z-index: -1;
          opacity: 0.1;
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

        footer {
          color: rgba(255,255,255,0.9);
          text-align: center;
          padding: 30px;
          font-size: 1rem;
          background: linear-gradient(135deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1));
          backdrop-filter: blur(25px);
          border-top: 1px solid rgba(255,255,255,0.1);
          margin-top: auto;
          position: relative;
        }

        footer::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
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
            radial-gradient(circle at 20% 30%, rgba(30, 64, 175,0.2), transparent 60%),
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

      {/* Ảnh 2 bên */}
      <div className="side-images-container">
        <div className="side-image left" style={{ backgroundImage: `url(${sideImages.left})` }}></div>
        <div className="side-image right" style={{ backgroundImage: `url(${sideImages.right})` }}></div>
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
      <footer>
        © 2025 Vé Xe Online — Trải nghiệm đặt vé dễ dàng & nhanh chóng
      </footer>
    </div>
  );
}
