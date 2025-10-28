import React, { useEffect, useState } from "react";
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
  const [loading, setLoading] = useState(false);

  const [hoTen, setHoTen] = useState("");
  const [sdt, setSdt] = useState("");

  // ✅ Lấy userId từ localStorage
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?._id;

  // ✅ Lấy danh sách chuyến đi
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

  // ✅ Tìm kiếm
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

  // ✅ Lấy ghế đã đặt
  const fetchBookedSeatsData = async (tripId: string) => {
    try {
      const res = await getBookedSeats(tripId);
      setBookedSeats(res.bookedSeats || []);
    } catch (error) {
      console.error("Lỗi tải ghế đã đặt:", error);
    }
  };

  const handleSelectSeat = (seatNumber: number) => {
    if (bookedSeats.includes(seatNumber)) return;
    setSelectedSeats(prev =>
      prev.includes(seatNumber)
        ? prev.filter(s => s !== seatNumber)
        : [...prev, seatNumber]
    );
  };

  const handleBookTrip = async (trip: Trip) => {
    setSelectedTrip(trip);
    setSelectedSeats([]);
    setShowSeatModal(true);
    await fetchBookedSeatsData(trip._id!);
  };

  // ✅ Xác nhận đặt vé
  const handleConfirmBooking = async () => {
    if (!selectedTrip || selectedSeats.length === 0) return alert("Chọn ghế trước khi đặt!");

    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user?._id || user?.id;
      if (!userId) return alert("❌ Không tìm thấy thông tin người dùng");

      const bookingData = {
        userId,
        tripId: selectedTrip._id,
        hoTen: hoTen || user.ten || "Khách vãng lai",
        sdt: sdt || user.sdt || "Chưa có",
        soGhe: selectedSeats,
        totalPrice: selectedSeats.length * selectedTrip.giaVe,
      };

      console.log("DEBUG BOOKING DATA:", bookingData);

      const res = await bookTicket(bookingData);
      alert(res.message || "Đặt vé thành công!");
      setShowSeatModal(false);
      setSelectedSeats([]);
      window.dispatchEvent(new Event("booking:created"));
    } catch (err: any) {
      console.error("Lỗi khi đặt vé:", err);
      alert(err.response?.data?.message || "Lỗi khi đặt vé!");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: "40px 20px", minHeight: "100vh", background: "linear-gradient(135deg, #f0f7ff, #e0f2fe)" }}>
      <h2 style={{ textAlign: "center", marginBottom: 30, color: "#1e3a8a", fontSize: "2rem", fontWeight: 700 }}>
        🚍 Tìm kiếm chuyến xe của bạn
      </h2>

      {/* Bộ lọc */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center",
        background: "white", padding: "20px", borderRadius: "16px", boxShadow: "0 8px 20px rgba(0,0,0,0.1)", marginBottom: "30px",
      }}>
        <input type="text" list="provinces" placeholder="🗺️ Nơi đi..."
          value={filters.tu} onChange={e => setFilters({...filters, tu: e.target.value})}
          style={{ padding: "12px", borderRadius: "10px", border: "1px solid #ccc", width: "220px" }}/>
        <datalist id="provinces">{provinces.map(p => <option key={p} value={p}/>)}</datalist>

        <input type="text" list="provinces" placeholder="📍 Nơi đến..."
          value={filters.den} onChange={e => setFilters({...filters, den: e.target.value})}
          style={{ padding: "12px", borderRadius: "10px", border: "1px solid #ccc", width: "220px" }}/>

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
              <img src={trip.hinhAnh ? `http://localhost:5000${trip.hinhAnh}` : "https://via.placeholder.com/300x160?text=No+Image"}
                alt={trip.tenChuyen} style={{ width: "100%", height: 160, objectFit: "cover" }}/>
              <div style={{ padding: "16px" }}>
                <h3 style={{ color: "#1e3a8a", fontSize: "18px", fontWeight: 700 }}>{trip.tenChuyen}</h3>
                <p>{trip.tu} → {trip.den}</p>
                <p>🕓 {trip.ngayKhoiHanh} - {trip.gioKhoiHanh}</p>
                <p>🚌 Nhà xe: {trip.nhaXe}</p>
                <p style={{ fontWeight: "bold", color: "#2563eb" }}>{trip.giaVe.toLocaleString()}₫</p>
                <button onClick={() => handleBookTrip(trip)} style={{
                  marginTop: 8, width: "100%", background: "#2563eb", color: "white",
                  border: "none", borderRadius: "8px", padding: "10px", cursor: "pointer", fontWeight: 600
                }}>🪑 Đặt vé</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal chọn ghế */}
      {showSeatModal && selectedTrip && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
        }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "20px", width: "420px", textAlign: "center" }}>
            <h3 style={{ color: "#1e3a8a", marginBottom: 10 }}>🚌 Chọn ghế - {selectedTrip.tenChuyen}</h3>

            <input placeholder="Họ tên hành khách" value={hoTen} onChange={e => setHoTen(e.target.value)}
              style={{ width: "100%", marginBottom: 10, padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}/>
            <input placeholder="Số điện thoại" value={sdt} onChange={e => setSdt(e.target.value)}
              style={{ width: "100%", marginBottom: 15, padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}/>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", margin: "20px 0" }}>
              {Array.from({ length: 20 }, (_, i) => i+1).map(seat => {
                const isBooked = bookedSeats.includes(seat);
                const isSelected = selectedSeats.includes(seat);
                return (
                  <div key={seat} onClick={() => handleSelectSeat(seat)}
                    style={{
                      padding: "10px 0", borderRadius: "8px",
                      background: isBooked ? "#9ca3af" : isSelected ? "#2563eb" : "#f9fafb",
                      color: isBooked ? "white" : "black", cursor: isBooked ? "not-allowed" : "pointer", fontWeight: 600
                    }}>{seat}</div>
                )
              })}
            </div>

            <p>Ghế đã chọn: <strong>{selectedSeats.join(", ") || "Chưa chọn"}</strong></p>
            <p style={{ color: "#2563eb", fontWeight: 700 }}>
              Tổng tiền: {(selectedTrip.giaVe * selectedSeats.length).toLocaleString()}₫
            </p>

            <div style={{ marginTop: 15, display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={() => setShowSeatModal(false)} style={{
                padding: "10px 16px", borderRadius: "8px", background: "#e5e7eb", border: "none", cursor: "pointer"
              }}>❌ Hủy</button>
              <button onClick={handleConfirmBooking} disabled={selectedSeats.length === 0 || loading}
                style={{
                  padding: "10px 16px", borderRadius: "8px",
                  background: selectedSeats.length && !loading ? "#2563eb" : "#93c5fd",
                  color: "white", border: "none", cursor: selectedSeats.length && !loading ? "pointer" : "not-allowed"
                }}>
                {loading ? "⏳ Đang đặt..." : "✅ Xác nhận"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
