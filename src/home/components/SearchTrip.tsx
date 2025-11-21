import { useEffect, useRef, useState } from "react";
import { getAllTrips } from "../../api/tripApi";
import { bookTicket, getBookedSeats } from "../../api/bookingApi";

interface Trip {
  _id?: string;
  tenChuyen: string;
  tu: string;
  den: string;
  ngayKhoiHanh?: string;
  gioKhoiHanh?: string;
  giaVe: number;
  nhaXe: string;
  hinhAnh?: string;

  // ✅ Các trường mới từ MongoDB
  maTai?: string;
  loaiXe?: string;
  hangXe?: string;
  mauSac?: string;
  soLuongGhe?: number;
  trangThai?: string;

  tienIch?: string;
  tongSoGhe?: number;
}

const provinces = [
  "An Giang","Bà Rịa - Vũng Tàu","Bắc Giang","Bắc Kạn","Bạc Liêu","Bắc Ninh",
  "Bến Tre","Bình Dương","Bình Định","Bình Phước","Bình Thuận","Cà Mau","Cần Thơ",
  "Cao Bằng","Đà Nẵng","Đắk Lắk","Đắk Nông","Điện Biên","Đồng Nai","Đồng Tháp",
  "Gia Lai","Hà Giang","Hà Nam","Hà Nội","Hà Tĩnh","Hải Dương","Hải Phòng","Hậu Giang",
  "Hòa Bình","Hưng Yên","Khánh Hòa","Kiên Giang","Kon Tum","Lai Châu","Lâm Đồng",
  "Lạng Sơn","Lào Cai","Long An","Nam Định","Nghệ An","Ninh Bình","Ninh Thuận","Phú Thọ",
  "Phú Yên","Quảng Bình","Quảng Nam","Quảng Ngãi","Quảng Ninh","Quảng Trị","Sóc Trăng",
  "Sơn La","Tây Ninh","Thái Bình","Thái Nguyên","Thanh Hóa","Thừa Thiên Huế","Tiền Giang",
  "TP. Hồ Chí Minh","Trà Vinh","Tuyên Quang","Vĩnh Long","Vĩnh Phúc","Yên Bái"
];

export default function SearchTrip() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
  const [filters, setFilters] = useState({ tu: "", den: "", ngayKhoiHanh: "" });

  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [bookedSeats, setBookedSeats] = useState<number[]>([]);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [hoTen, setHoTen] = useState("");
  const [sdt, setSdt] = useState("");

  const pollingRef = useRef<number | null>(null);

  // Lấy danh sách chuyến
  const fetchTrips = async () => {
    try {
      const data = await getAllTrips();
      setTrips(data);
      setFilteredTrips(data);
    } catch (error) {
      console.error("Lỗi tải chuyến:", error);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  const handleSearch = () => {
    const { tu, den, ngayKhoiHanh } = filters;
    const results = trips.filter((trip) => {
      const matchTu = tu ? trip.tu.toLowerCase().includes(tu.toLowerCase()) : true;
      const matchDen = den ? trip.den.toLowerCase().includes(den.toLowerCase()) : true;
      const matchNgay = ngayKhoiHanh ? trip.ngayKhoiHanh?.startsWith(ngayKhoiHanh) : true;
      return matchTu && matchDen && matchNgay;
    });
    setFilteredTrips(results);
  };

  const fetchBookedSeatsData = async (tripId: string) => {
    try {
      const bookedSeatsStrings = await getBookedSeats(tripId);
      const bookedSeatsNumbers = bookedSeatsStrings
        .map(seat => Number(seat))
        .filter(n => Number.isFinite(n) && n > 0);
      const uniqueBookedSeats = Array.from(new Set(bookedSeatsNumbers)).sort((a, b) => a - b);
      setBookedSeats(uniqueBookedSeats);
      console.log("✅ Ghế đã đặt:", uniqueBookedSeats);
    } catch (error) {
      console.error("Lỗi tải ghế đã đặt:", error);
      setBookedSeats([]);
    }
  };

  const handleBookTrip = async (trip: Trip) => {
    setSelectedTrip(trip);
    setSelectedSeats([]);
    setShowSeatModal(true);
    await fetchBookedSeatsData(trip._id!);
  };

  const handleViewDetails = async (trip: Trip) => {
    setSelectedTrip(trip);
    setShowDetailModal(true);
    await fetchBookedSeatsData(trip._id!);
  };

  const handleConfirmBooking = async () => {
    if (!selectedTrip || selectedSeats.length === 0)
      return alert("❌ Vui lòng chọn ghế trước khi đặt!");

    if (!hoTen.trim() || !sdt.trim())
      return alert("⚠️ Vui lòng nhập đầy đủ họ tên và số điện thoại!");

    if (!/^[0-9]{9,11}$/.test(sdt))
      return alert("⚠️ Số điện thoại không hợp lệ! (9–11 chữ số)");

    try {
      const latestStrings = await getBookedSeats(selectedTrip._id!);
      const latestBooked: number[] = latestStrings
        .map(seat => Number(seat))
        .filter(n => Number.isFinite(n) && n > 0);
      const conflicts = selectedSeats.filter((s) => latestBooked.includes(s));
      if (conflicts.length) {
        setBookedSeats(latestBooked);
        setSelectedSeats((prev) => prev.filter((s) => !latestBooked.includes(s)));
        return alert(`⚠️ Ghế ${conflicts.join(", ")} vừa được đặt bởi người khác. Vui lòng chọn ghế khác.`);
      }

      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user?._id || user?.id;
      if (!userId) return alert("❌ Không tìm thấy thông tin người dùng");

      const bookingData = {
        userId,
        tripId: selectedTrip._id,
        hoTen,
        sdt,
        soGhe: selectedSeats,
        totalPrice: selectedSeats.length * selectedTrip.giaVe,
      };

      const res = await bookTicket(bookingData);
      alert(res.message || "🎉 Đặt vé thành công!");
      setShowSeatModal(false);
      setSelectedSeats([]);
      setHoTen("");
      setSdt("");
      window.dispatchEvent(new Event("booking:created"));
    } catch (err: any) {
      console.error("Lỗi khi đặt vé:", err);
      alert(err.response?.data?.message || "Lỗi khi đặt vé!");
    } finally {
      setLoading(false);
    }
  };

  // Polling ghế đang chọn
  useEffect(() => {
    if (showSeatModal && selectedTrip?._id) {
      fetchBookedSeatsData(selectedTrip._id);
      pollingRef.current = window.setInterval(() => {
        fetchBookedSeatsData(selectedTrip._id!);
      }, 4000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [showSeatModal, selectedTrip?._id]);

  return (
    <div style={{  minHeight: "100vh", }}>
      <h2 style={{ textAlign: "center", margin: 4, color: "#e8e8e9ff", fontSize: "3.5rem", fontWeight: 700 }}>

        🚍 Tìm kiếm chuyến xe của bạn
      </h2>

      {/* Bộ lọc */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center",
        background: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", marginBottom: "30px",
      }}>
        <select
          value={filters.tu}
          onChange={e => setFilters({ ...filters, tu: e.target.value })}
          style={{ padding: "12px", borderRadius: "10px", border: "1px solid #ccc", width: "220px" }}
        >
          <option value="">🗺️ Chọn nơi đi...</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select
          value={filters.den}
          onChange={e => setFilters({ ...filters, den: e.target.value })}
          style={{ padding: "12px", borderRadius: "10px", border: "1px solid #ccc", width: "220px" }}
        >
          <option value="">📍 Chọn nơi đến...</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <input type="date" value={filters.ngayKhoiHanh} onChange={e => setFilters({...filters, ngayKhoiHanh: e.target.value})}
          style={{ padding: "12px", borderRadius: "10px", border: "1px solid #ccc", width: "200px" }}/>

        <button onClick={handleSearch} style={{
          background: "linear-gradient(90deg, #2563eb, #1e40af)", color: "white", border: "none",
          borderRadius: "10px", padding: "12px 20px", cursor: "pointer", fontWeight: 600
        }}>🔍 Tìm kiếm</button>
      </div>

      {/* Danh sách chuyến */}
      {filteredTrips.length === 0 ? (
        <p style={{ textAlign: "center", color: "#6b7280", fontSize: "18px" }}>Không tìm thấy chuyến xe nào 😢</p>
      ) : (
        <div style={{ display: "grid", gap: "24px", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {filteredTrips.map(trip => (
            <div key={trip._id} style={{ background: "white", borderRadius: "16px", overflow: "hidden", boxShadow: "0 6px 15px rgba(0,0,0,0.1)" }}>
              <img
                src={trip.hinhAnh || "https://via.placeholder.com/300x160?text=No+Image"}
                alt={trip.tenChuyen}
                style={{ width: "100%", height: 160, objectFit: "cover" }}
              />
              <div style={{ padding: "16px" }}>
                <h3 style={{ color: "#1e3a8a", fontSize: "18px", fontWeight: 700 }}>{trip.tenChuyen}</h3>
                <p>{trip.tu} → {trip.den}</p>
                <p>🕓 {trip.ngayKhoiHanh} - {trip.gioKhoiHanh}</p>
                <p>🚌 Nhà xe: {trip.nhaXe}</p>

                {/* ✅ Thông tin mới hiển thị ở card */}
                <p>🚗 Hãng xe: {trip.hangXe || "Không rõ"}</p>
                <p>🔢 Mã tài: {trip.maTai || "Chưa có"}</p>
                <p>🎨 Màu: {trip.mauSac || "Không rõ"}</p>

                <p style={{ fontWeight: "bold", color: "#2563eb" }}>{trip.giaVe.toLocaleString()}₫</p>
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button onClick={() => handleViewDetails(trip)} style={{
                    flex: 1, background: "#f59e0b", color: "white", border: "none",
                    borderRadius: "8px", padding: "10px", cursor: "pointer", fontWeight: 600
                  }}>👁️ Xem chi tiết</button>
                  <button onClick={() => handleBookTrip(trip)} style={{
                    flex: 1, background: "#2563eb", color: "white", border: "none",
                    borderRadius: "8px", padding: "10px", cursor: "pointer", fontWeight: 600
                  }}>🪑 Đặt vé</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal chi tiết */}
      {showDetailModal && selectedTrip && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            width: "600px", borderRadius: "20px", overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            position: "relative"
          }}>
            <div style={{
              height: "200px",
              backgroundImage: `url(${selectedTrip.hinhAnh || "https://i.imgur.com/OUkLi.gif"})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative",
            }}>
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }}></div>
              <h3 style={{
                position: "absolute", bottom: "20px", left: "20px",
                color: "white", fontSize: "24px", fontWeight: 700,
                textShadow: "0 2px 8px rgba(0,0,0,0.4)"
              }}>
                🚌 {selectedTrip.tenChuyen}
              </h3>
            </div>
            <div style={{ padding: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: "14px", columnGap: "20px", fontSize: "16px" }}>
                <div>
                  <p><strong>📍 Tuyến:</strong> {selectedTrip.tu} → {selectedTrip.den}</p>
                  <p><strong>🗓️ Ngày khởi hành:</strong> {selectedTrip.ngayKhoiHanh}</p>
                  <p><strong>⏰ Giờ khởi hành:</strong> {selectedTrip.gioKhoiHanh}</p>
                  <p><strong>🚗 Hãng xe:</strong> {selectedTrip.hangXe || "Không rõ"}</p>
                </div>
                <div>
                  <p><strong>🏢 Nhà xe:</strong> {selectedTrip.nhaXe}</p>
                  <p><strong>🔢 Mã tài:</strong> {selectedTrip.maTai || "Chưa có"}</p>
                  <p><strong>🎨 Màu xe:</strong> {selectedTrip.mauSac || "Không rõ"}</p>
                  <p><strong>🟢 Trạng thái:</strong> {selectedTrip.trangThai || "Hoạt động"}</p>
                </div>
              </div>
              <div
  style={{
    marginTop: "20px",
    background: "#f1f5f9",
    padding: "16px",
    borderRadius: "10px",
  }}
>
  <strong>✨ Tiện ích:</strong>
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr", // ✅ Hai cột dọc
      rowGap: "10px",
      columnGap: "20px",
      marginTop: "10px",
      lineHeight: 1.8,
    }}
  >
    {(selectedTrip.tienIch
      ? selectedTrip.tienIch.split("·")
      : [
          "🚍 Ghế ngả êm ái 45°",
          "❄️ Điều hòa mát lạnh",
          "📶 Wi-Fi tốc độ cao",
          "🔌 Sạc USB tại mỗi ghế",
          "💧 Nước suối & khăn lạnh",
          "🎬 TV giải trí trung tâm",
          "🧻 Nhà vệ sinh sạch",
          "🎧 Tai nghe cá nhân",
          "🪑 Khoang hành lý rộng",
        ]
    ).map((item, index) => (
      <div
        key={index}
        style={{
          background: "#ffffff",
          padding: "6px 10px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
        }}
      >
        {item.trim()}
      </div>
    ))}
  </div>
</div>



              <div style={{ marginTop: "24px", textAlign: "center", background: "linear-gradient(90deg, #2563eb, #1e3a8a)", color: "white", padding: "16px", borderRadius: "14px", fontSize: "20px", fontWeight: "700", letterSpacing: "0.5px" }}>
                💰 Giá vé: {selectedTrip.giaVe.toLocaleString()}₫
              </div>
              <div style={{ marginTop: "24px", textAlign: "center" }}>
                <button onClick={() => setShowDetailModal(false)} style={{
                  padding: "12px 26px", background: "linear-gradient(90deg, #f87171, #ef4444)",
                  color: "white", border: "none", borderRadius: "12px", fontWeight: "600", cursor: "pointer"
                }}>❌ Đóng</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modal chọn ghế */}
      {showSeatModal && selectedTrip && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "20px", width: "480px", textAlign: "center" }}>
            <h3 style={{ color: "#1e3a8a", marginBottom: 10 }}>🚌 Chọn ghế - {selectedTrip.tenChuyen}</h3>
            <input placeholder="Họ tên hành khách" value={hoTen} onChange={e => setHoTen(e.target.value)} style={{ width: "100%", marginBottom: 10, padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}/>
            <input placeholder="Số điện thoại" value={sdt} onChange={e => setSdt(e.target.value)} style={{ width: "100%", marginBottom: 15, padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}/>

            {/* Grid ghế */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", margin: "20px 0" }}>
              {Array.from({ length: selectedTrip.tongSoGhe || 20 }, (_, i) => {
                const seatNum = i + 1;
                const isBooked = bookedSeats.includes(seatNum);
                const isSelected = selectedSeats.includes(seatNum);
                return (
                  <button key={seatNum} disabled={isBooked} onClick={() => {
                    setSelectedSeats(prev => prev.includes(seatNum)
                      ? prev.filter(s => s !== seatNum)
                      : [...prev, seatNum]);
                  }} style={{
                    padding: "10px", borderRadius: "8px", fontWeight: "bold",
                    background: isBooked ? "#9ca3af" : isSelected ? "#2563eb" : "#e5e7eb",
                    color: isBooked ? "white" : isSelected ? "white" : "#111827",
                    border: "none", cursor: isBooked ? "not-allowed" : "pointer"
                  }}>{seatNum}</button>
                );
              })}
            </div>

            <p>🟢 Ghế trống | 🔵 Ghế bạn chọn | ⚪ Ghế đã đặt</p>
            <p style={{ marginTop: 10 }}>💰 Tổng tiền: <strong>{(selectedSeats.length * selectedTrip.giaVe).toLocaleString()}₫</strong></p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 10 }}>
              <button onClick={() => setShowSeatModal(false)} style={{
                background: "#ef4444", color: "white", border: "none", borderRadius: "8px",
                padding: "10px 16px", fontWeight: 600
              }}>Hủy</button>
              <button onClick={handleConfirmBooking} disabled={loading} style={{
                background: "#2563eb", color: "white", border: "none", borderRadius: "8px",
                padding: "10px 16px", fontWeight: 600, opacity: loading ? 0.7 : 1
              }}>{loading ? "⏳ Đang đặt..." : "✅ Xác nhận đặt vé"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
  