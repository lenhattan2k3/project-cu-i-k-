import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ownerImage from "./assets/owner.png";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      const sections = document.querySelectorAll(".fade-section");
      sections.forEach((sec) => {
        const top = sec.getBoundingClientRect().top;
        if (top < window.innerHeight - 100) {
          sec.classList.add("show");
        }
      });
    };

  const handleMouseMove = (e: MouseEvent) => {
  setMousePos({ x: e.clientX, y: e.clientY });
};


    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const stats = [
    { number: "500K+", label: "Khách hàng tin dùng", icon: "👥", color: "#ff6b9d" },
    { number: "10K+", label: "Tuyến đường", icon: "🗺️", color: "#feca57" },
    { number: "99%", label: "Tỷ lệ hài lòng", icon: "⭐", color: "#48dbfb" },
    { number: "24/7", label: "Hỗ trợ khách hàng", icon: "💬", color: "#ff9ff3" },
  ];

  const transports = [
    {
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800",
      icon: "🚌",
      title: "Xe khách",
      desc: "Nhiều hãng xe uy tín, tiện lợi và an toàn.",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    },
    {
      image: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800",
      icon: "🚄",
      title: "Tàu hỏa",
      desc: "Khởi hành linh hoạt, tiết kiệm thời gian.",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
    },
    {
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800",
      icon: "✈️",
      title: "Máy bay",
      desc: "Giá vé tốt, liên kết nhiều hãng hàng không.",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
    },
  ];

  return (
    <div className="landing-page">
      <div 
        className="cursor-glow" 
        style={{ 
          left: mousePos.x, 
          top: mousePos.y 
        }}
      />

      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="logo">
            <div className="logo-icon">
              <span className="logo-emoji">🚍</span>
              <div className="logo-rings">
                <div className="ring ring-1"></div>
                <div className="ring ring-2"></div>
                <div className="ring ring-3"></div>
              </div>
            </div>
            <span className="logo-text">Vexe Online</span>
          </div>
          <nav className="nav-buttons">
            <button className="btn-outline" onClick={() => navigate('/login')}>
              <span>Đăng nhập</span>
            </button>
            <button className="btn-gradient" onClick={() => navigate('/register')}>
              <span>Đăng ký</span>
              <div className="btn-shine"></div>
            </button>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="hero-bg">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        <div className="grid-pattern"></div>
        
        <div className="container hero-content">
          <div className="hero-badge">
            <span className="badge-sparkle">✨</span>
            <span>Nền tảng đặt vé #1 Việt Nam</span>
            <span className="badge-sparkle">✨</span>
          </div>
          
          <h1 className="hero-title">
            <span className="word">Đặt</span>{' '}
            <span className="word">vé</span>{' '}
            <span className="word">online</span>
            <br />
            <span className="gradient-word">Nhanh</span>{' '}
            <span className="gradient-word">Tiện</span>{' '}
            <span className="gradient-word">An toàn</span>
          </h1>
          
          <p className="hero-subtitle">
            Trải nghiệm nền tảng đặt vé hiện đại với hàng ngàn tuyến đường
            <br />và ưu đãi hấp dẫn mỗi ngày
          </p>
          
          <div className="hero-buttons">
            <button className="btn-primary" onClick={() => navigate('/register')}>
              <span className="btn-content">
                <span className="btn-icon">🚀</span>
                <span>Bắt đầu ngay</span>
              </span>
              <div className="btn-glow-effect"></div>
            </button>
            <button className="btn-secondary" onClick={() => navigate('/login')}>
              <span className="btn-content">
                <span className="btn-icon">📖</span>
                <span>Tìm hiểu thêm</span>
              </span>
            </button>
          </div>
        </div>

        <div className="floating-elements">
          <div className="float-icon float-1">🎫</div>
          <div className="float-icon float-2">✈️</div>
          <div className="float-icon float-3">🚌</div>
          <div className="float-icon float-4">⭐</div>
          <div className="float-icon float-5">🎉</div>
        </div>
      </section>

      <section className="stats fade-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, i) => (
              <div 
                key={i} 
                className="stat-card"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="stat-bg" style={{ background: stat.color }}></div>
                <div className="stat-icon">{stat.icon}</div>
                <h3 className="stat-number">{stat.number}</h3>
                <p className="stat-label">{stat.label}</p>
                <div className="stat-particles">
                  <span>✦</span>
                  <span>✦</span>
                  <span>✦</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="transport fade-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">🚀 Phương tiện</div>
            <h2 className="section-title">
              Đa dạng lựa chọn cho
              <span className="highlight"> mọi hành trình</span>
            </h2>
            <p className="section-subtitle">
              Từ xe khách đến máy bay, chúng tôi có tất cả
            </p>
          </div>
          
          <div className="transport-grid">
            {transports.map((t, i) => (
              <div 
                key={i} 
                className="transport-card"
                style={{ animationDelay: `${i * 0.15}s` }}
              >
                <div className="card-glow" style={{ background: t.gradient }}></div>
                <div className="transport-image" style={{ backgroundImage: `url(${t.image})` }}>
                  <div className="transport-overlay" style={{ background: t.gradient }}>
                    <div className="transport-icon">{t.icon}</div>
                  </div>
                  <div className="image-shine"></div>
                </div>
                <div className="transport-content">
                  <h3 className="transport-title">{t.title}</h3>
                  <p className="transport-desc">{t.desc}</p>
                  <button className="transport-btn" style={{ background: t.gradient }} onClick={() => navigate('/register')}>
                    <span>Khám phá ngay</span>
                    <span className="btn-arrow">→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="features fade-section">
        <div className="container">
          <div className="section-header">
            <div className="section-badge">💎 Đặc điểm</div>
            <h2 className="section-title">
              Tại sao chọn
              <span className="highlight"> Vexe Online?</span>
            </h2>
          </div>
          
          <div className="features-grid">
            {[
              { icon: "⚡", title: "Đặt vé siêu tốc", desc: "Chỉ 30 giây để hoàn tất đặt vé", color: "#feca57" },
              { icon: "💳", title: "Thanh toán đa dạng", desc: "Hỗ trợ tất cả phương thức", color: "#48dbfb" },
              { icon: "🎁", title: "Ưu đãi cực khủng", desc: "Giảm giá đến 50% mỗi ngày", color: "#ff6b9d" },
              { icon: "🔒", title: "Bảo mật tối đa", desc: "Mã hóa chuẩn ngân hàng", color: "#ff9ff3" },
            ].map((f, i) => (
              <div 
                key={i} 
                className="feature-card"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="feature-glow" style={{ background: f.color }}></div>
                <div className="feature-icon-wrapper">
                  <div className="feature-icon">{f.icon}</div>
                  <div className="icon-ring" style={{ borderColor: f.color }}></div>
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="testimonial fade-section">
        <div className="container">
          <div className="testimonial-card">
            <div className="quote-icon">💬</div>
            <p className="quote-text">
             Tôi đã phát triển website Vexe Online với mục tiêu mang đến trải nghiệm đặt vé nhanh chóng, tiện lợi và đáng tin cậy cho mọi người.
            </p>
            <div className="author">
              <div className="author-avatar">
  <img src={ownerImage} alt="Ảnh tác giả" className="avatar-img" />
</div>

              <div>
                <div className="author-name">Lê Nhật Tân </div>
                <div className="author-role">Chủ Sở Hữu</div>
              </div>
            </div>
            <div className="stars">⭐⭐⭐⭐⭐</div>
          </div>
        </div>
      </section>

      <section className="cta fade-section">
        <div className="cta-bg">
          <div className="cta-orb cta-orb-1"></div>
          <div className="cta-orb cta-orb-2"></div>
        </div>
        <div className="container">
          <div className="cta-content">
            <div className="cta-icon">🎉</div>
            <h2 className="cta-title">
              Sẵn sàng cho hành trình
              <span className="cta-highlight"> tuyệt vời?</span>
            </h2>
            <p className="cta-subtitle">
              Đăng ký ngay và nhận <strong>VOUCHER 100K</strong> cho chuyến đi đầu tiên
            </p>
            <button className="btn-cta" onClick={() => navigate('/register')}>
              <span>Đăng ký miễn phí ngay</span>
              <div className="btn-cta-glow"></div>
            </button>
            <p className="cta-note">🎁 Không cần thẻ tín dụng • Miễn phí mãi mãi</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <div className="footer-logo">
                <div className="logo-icon small">
                  <span className="logo-emoji">🚍</span>
                </div>
                <span>Vexe Online</span>
              </div>
              <p className="footer-desc">
                Nền tảng đặt vé hàng đầu Việt Nam. Nhanh chóng, tiện lợi và an toàn.
              </p>
            </div>
            <div className="footer-col">
              <h4>Liên hệ</h4>
              <p>📧 support@vexeonline.vn</p>
              <p>📞 Hotline: 1900 9999</p>
            </div>
            <div className="footer-col">
              <h4>Theo dõi</h4>
              <div className="social-links">
                <a href="#" className="social-link">Facebook</a>
                <a href="#" className="social-link">Instagram</a>
                <a href="#" className="social-link">Twitter</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 Vexe Online • Made with 💜 in Vietnam</p>
          </div>
        </div>
      </footer>

      <style>{`
      .author-avatar {
  width: 500px;
  height:500px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #2563eb;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(198, 16, 16, 0.1);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        .landing-page {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
          color: #1e293b;
          overflow-x: hidden;
          background: #0a0a0f;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .cursor-glow {
          position: fixed;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
          transform: translate(-50%, -50%);
          z-index: 9999;
          transition: opacity 0.3s;
        }

        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(10, 10, 15, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.4s ease;
        }

        .header.scrolled {
          background: rgba(10, 10, 15, 0.95);
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.2);
        }

        .header .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 80px;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
        }

        .logo-icon {
          position: relative;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-icon.small {
          width: 40px;
          height: 40px;
        }

        .logo-emoji {
          font-size: 32px;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 0 8px rgba(102, 126, 234, 0.6));
        }

        .logo-icon.small .logo-emoji {
          font-size: 24px;
        }

        .logo-rings {
          position: absolute;
          inset: 0;
        }

        .ring {
          position: absolute;
          inset: 0;
          border: 2px solid;
          border-radius: 50%;
          animation: ringPulse 3s ease-in-out infinite;
        }

        .ring-1 {
          border-color: rgba(102, 126, 234, 0.4);
          animation-delay: 0s;
        }

        .ring-2 {
          border-color: rgba(118, 75, 162, 0.4);
          animation-delay: 1s;
        }

        .ring-3 {
          border-color: rgba(240, 147, 251, 0.4);
          animation-delay: 2s;
        }

        @keyframes ringPulse {
          0%, 100% {
            transform: scale(0.8);
            opacity: 0;
          }
          50% {
            transform: scale(1.3);
            opacity: 1;
          }
        }

        .logo-text {
          font-size: 24px;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }

        .nav-buttons {
          display: flex;
          gap: 16px;
        }

        .btn-outline, .btn-gradient {
          position: relative;
          padding: 12px 28px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.4s ease;
          border: none;
          overflow: hidden;
        }

        .btn-outline {
          background: transparent;
          border: 2px solid rgba(255, 255, 255, 0.2);
          color: white;
        }

        .btn-outline:hover {
          border-color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-2px);
        }

        .btn-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: shine 3s infinite;
        }

        @keyframes shine {
          0% { left: -100%; }
          100% { left: 200%; }
        }

        .btn-gradient:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(102, 126, 234, 0.4);
        }

        .hero {
          position: relative;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #0a0a0f;
        }

        .hero-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.6;
          animation: orbFloat 20s ease-in-out infinite;
        }

        .orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, #667eea 0%, transparent 70%);
          top: -200px;
          left: -100px;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #764ba2 0%, transparent 70%);
          bottom: -150px;
          right: -100px;
          animation-delay: 7s;
        }

        .orb-3 {
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, #f093fb 0%, transparent 70%);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 14s;
        }

        @keyframes orbFloat {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(100px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-50px, 100px) scale(0.9);
          }
        }

        .grid-pattern {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        .hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          color: white;
          padding: 120px 0 80px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 50px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          animation: badgePulse 2s ease-in-out infinite;
        }

        @keyframes badgePulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
          }
        }

        .badge-sparkle {
          animation: sparkle 1.5s ease-in-out infinite;
        }

        @keyframes sparkle {
          0%, 100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: scale(1.3) rotate(180deg);
            opacity: 0.7;
          }
        }

        .hero-title {
          font-size: clamp(40px, 7vw, 80px);
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 32px;
          letter-spacing: -2px;
        }

        .word {
          display: inline-block;
          margin: 0 8px;
          animation: wordFadeIn 0.8s ease forwards;
          opacity: 0;
        }

        .word:nth-child(1) { animation-delay: 0.1s; }
        .word:nth-child(2) { animation-delay: 0.2s; }
        .word:nth-child(3) { animation-delay: 0.3s; }

        @keyframes wordFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .gradient-word {
          display: inline-block;
          margin: 0 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 3s ease-in-out infinite, wordFadeIn 0.8s ease forwards;
          opacity: 0;
        }

        .gradient-word:nth-child(4) { animation-delay: 0.4s; }
        .gradient-word:nth-child(5) { animation-delay: 0.5s; }
        .gradient-word:nth-child(6) { animation-delay: 0.6s; }

        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .hero-subtitle {
          font-size: clamp(16px, 2vw, 20px);
          line-height: 1.8;
          opacity: 0.85;
          margin-bottom: 48px;
          max-width: 700px;
          margin-left: auto;
          margin-right: auto;
        }

        .hero-buttons {
          display: flex;
          gap: 24px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary, .btn-secondary {
          position: relative;
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 16px;
          font-weight: 700;
          overflow: hidden;
        }

        .btn-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 20px 40px;
        }

        .btn-icon {
          font-size: 20px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          color: white;
          transition: all 0.4s ease;
        }

        .btn-glow-effect {
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          opacity: 0;
          filter: blur(20px);
          transition: opacity 0.4s ease;
        }

        .btn-primary:hover .btn-glow-effect {
          opacity: 0.8;
        }

        .btn-primary:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 20px 50px rgba(102, 126, 234, 0.4);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          color: white;
          transition: all 0.4s ease;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-4px);
        }

        .floating-elements {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .float-icon {
          position: absolute;
          font-size: 40px;
          opacity: 0.6;
          filter: drop-shadow(0 0 10px rgba(102, 126, 234, 0.6));
          animation: float 6s ease-in-out infinite;
        }

        .float-1 {
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }

        .float-2 {
          top: 30%;
          right: 15%;
          animation-delay: 1s;
        }

        .float-3 {
          bottom: 25%;
          left: 15%;
          animation-delay: 2s;
        }

        .float-4 {
          top: 50%;
          right: 10%;
          animation-delay: 3s;
        }

        .float-5 {
          bottom: 20%;
          right: 20%;
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-30px) rotate(10deg);
          }
        }

        .stats {
          padding: 100px 0;
          background: #0a0a0f;
          position: relative;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 32px;
        }

        .stat-card {
          position: relative;
          text-align: center;
          padding: 48px 32px;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          color: white;
          transition: all 0.4s ease;
          overflow: hidden;
        }

        .stat-bg {
          position: absolute;
          inset: -50%;
          opacity: 0;
          filter: blur(40px);
          transition: opacity 0.4s ease;
        }

        .stat-card:hover .stat-bg {
          opacity: 0.3;
        }

        .stat-card:hover {
          transform: translateY(-12px) scale(1.05);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .stat-icon {
          font-size: 56px;
          margin-bottom: 16px;
          filter: drop-shadow(0 0 12px rgba(102, 126, 234, 0.6));
        }

        .stat-number {
          font-size: 48px;
          font-weight: 900;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #fff 0%, #c7d2fe 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-label {
          font-size: 16px;
          opacity: 0.8;
        }

        .stat-particles {
          position: absolute;
          top: 20px;
          right: 20px;
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .stat-card:hover .stat-particles {
          opacity: 0.6;
        }

        .stat-particles span {
          animation: particleTwinkle 2s ease-in-out infinite;
        }

        .stat-particles span:nth-child(2) {
          animation-delay: 0.3s;
        }

        .stat-particles span:nth-child(3) {
          animation-delay: 0.6s;
        }

        @keyframes particleTwinkle {
          0%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        .transport {
          padding: 120px 0;
          background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%);
        }

        .section-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .section-badge {
          display: inline-block;
          padding: 8px 20px;
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 50px;
          color: #667eea;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: clamp(32px, 5vw, 56px);
          font-weight: 900;
          color: white;
          margin-bottom: 16px;
          letter-spacing: -1px;
        }

        .highlight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .section-subtitle {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.6);
        }

        .transport-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 40px;
        }

        .transport-card {
          position: relative;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 28px;
          overflow: hidden;
          transition: all 0.5s ease;
        }

        .card-glow {
          position: absolute;
          inset: -100%;
          opacity: 0;
          filter: blur(60px);
          transition: opacity 0.5s ease;
        }

        .transport-card:hover .card-glow {
          opacity: 0.4;
        }

        .transport-card:hover {
          transform: translateY(-16px) scale(1.02);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .transport-image {
          height: 280px;
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
        }

        .transport-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.5s ease;
        }

        .transport-card:hover .transport-overlay {
          opacity: 0.95;
        }

        .transport-icon {
          font-size: 100px;
          filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
          animation: iconBounce 0.6s ease;
        }

        @keyframes iconBounce {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }

        .image-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          animation: imageShine 3s infinite;
        }

        @keyframes imageShine {
          0% {
            left: -100%;
          }
          100% {
            left: 200%;
          }
        }

        .transport-content {
          padding: 32px;
          color: white;
        }

        .transport-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 12px;
        }

        .transport-desc {
          font-size: 15px;
          opacity: 0.7;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .transport-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 16px;
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .transport-btn:hover {
          transform: translateX(4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .btn-arrow {
          transition: transform 0.3s ease;
        }

        .transport-btn:hover .btn-arrow {
          transform: translateX(4px);
        }

        .features {
          padding: 120px 0;
          background: #0a0a0f;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 32px;
        }

        .feature-card {
          position: relative;
          text-align: center;
          padding: 48px 32px;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          color: white;
          transition: all 0.4s ease;
          overflow: hidden;
        }

        .feature-glow {
          position: absolute;
          inset: -50%;
          opacity: 0;
          filter: blur(40px);
          transition: opacity 0.4s ease;
        }

        .feature-card:hover .feature-glow {
          opacity: 0.2;
        }

        .feature-card:hover {
          transform: translateY(-12px);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .feature-icon-wrapper {
          position: relative;
          display: inline-block;
          margin-bottom: 24px;
        }

        .feature-icon {
          font-size: 64px;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 4px 12px rgba(102, 126, 234, 0.4));
        }

        .icon-ring {
          position: absolute;
          inset: -20px;
          border: 2px solid;
          border-radius: 50%;
          opacity: 0;
          transition: all 0.4s ease;
        }

        .feature-card:hover .icon-ring {
          opacity: 1;
          transform: scale(1.2) rotate(180deg);
        }

        .feature-card h3 {
          font-size: 22px;
          font-weight: 700;
          margin-bottom: 12px;
        }

        .feature-card p {
          font-size: 15px;
          opacity: 0.7;
          line-height: 1.6;
        }

        .testimonial {
          padding: 100px 0;
          background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%);
        }

        .testimonial-card {
          max-width: 800px;
          margin: 0 auto;
          padding: 60px;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          color: white;
          text-align: center;
          position: relative;
        }

        .quote-icon {
          font-size: 56px;
          margin-bottom: 24px;
          opacity: 0.3;
        }

        .quote-text {
          font-size: 22px;
          line-height: 1.8;
          font-style: italic;
          margin-bottom: 32px;
          opacity: 0.9;
        }

        .author {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 16px;
        }

        .author-avatar {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }

        .author-name {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .author-role {
          font-size: 14px;
          opacity: 0.6;
        }

        .stars {
          font-size: 24px;
        }

        .cta {
          padding: 120px 0;
          background: #0a0a0f;
          position: relative;
          overflow: hidden;
        }

        .cta-bg {
          position: absolute;
          inset: 0;
        }

        .cta-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.5;
        }

        .cta-orb-1 {
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, #667eea 0%, transparent 70%);
          top: -200px;
          left: -100px;
        }

        .cta-orb-2 {
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, #f093fb 0%, transparent 70%);
          bottom: -150px;
          right: -100px;
        }

        .cta-content {
          position: relative;
          z-index: 2;
          text-align: center;
          color: white;
        }

        .cta-icon {
          font-size: 80px;
          margin-bottom: 24px;
          animation: ctaBounce 2s ease-in-out infinite;
        }

        @keyframes ctaBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        .cta-title {
          font-size: clamp(36px, 5vw, 56px);
          font-weight: 900;
          margin-bottom: 20px;
          letter-spacing: -1px;
        }

        .cta-highlight {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .cta-subtitle {
          font-size: 20px;
          margin-bottom: 40px;
          opacity: 0.9;
        }

        .btn-cta {
          position: relative;
          padding: 24px 56px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 16px;
          color: white;
          font-size: 20px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.4s ease;
          overflow: hidden;
        }

        .btn-cta-glow {
          position: absolute;
          inset: -4px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          opacity: 0;
          filter: blur(24px);
          transition: opacity 0.4s ease;
          animation: ctaPulse 2s ease-in-out infinite;
        }

        @keyframes ctaPulse {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 0.8;
          }
        }

        .btn-cta:hover {
          transform: translateY(-6px) scale(1.05);
          box-shadow: 0 24px 60px rgba(102, 126, 234, 0.5);
        }

        .btn-cta:hover .btn-cta-glow {
          opacity: 1;
        }

        .cta-note {
          margin-top: 24px;
          font-size: 14px;
          opacity: 0.6;
        }

        .footer {
          background: linear-gradient(180deg, #1a1a2e 0%, #0a0a0f 100%);
          color: rgba(255, 255, 255, 0.6);
          padding: 80px 0 32px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 48px;
          margin-bottom: 48px;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 700;
          color: white;
          margin-bottom: 16px;
        }

        .footer-desc {
          line-height: 1.8;
          font-size: 14px;
        }

        .footer-col h4 {
          color: white;
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .footer-col p {
          margin-bottom: 12px;
          font-size: 14px;
        }

        .social-links {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .social-link {
          color: rgba(255, 255, 255, 0.6);
          text-decoration: none;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .social-link:hover {
          color: #667eea;
          transform: translateX(4px);
        }

        .footer-bottom {
          padding-top: 32px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
          font-size: 14px;
        }

        .fade-section {
          opacity: 0;
          transform: translateY(40px);
          transition: all 1s ease;
        }

        .fade-section.show {
          opacity: 1;
          transform: translateY(0);
        }

        @media (max-width: 768px) {
          .header .container {
            height: 70px;
          }

          .logo-icon {
            width: 44px;
            height: 44px;
          }

          .logo-emoji {
            font-size: 24px;
          }

          .logo-text {
            font-size: 20px;
          }

          .nav-buttons {
            gap: 12px;
          }

          .btn-outline, .btn-gradient {
            padding: 10px 20px;
            font-size: 14px;
          }

          .hero-content {
            padding: 100px 0 60px;
          }

          .float-icon {
            display: none;
          }

          .hero-buttons {
            flex-direction: column;
            align-items: stretch;
          }

          .stats, .transport, .features, .cta {
            padding: 60px 0;
          }

          .stats-grid, .transport-grid, .features-grid {
            grid-template-columns: 1fr;
          }

          .testimonial-card {
            padding: 40px 24px;
          }

          .quote-text {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}