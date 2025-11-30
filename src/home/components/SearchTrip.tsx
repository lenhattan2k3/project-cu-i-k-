import { useEffect, useRef, useState, useMemo } from "react";
import { getAllTrips } from "../../api/tripApi";
import { bookTicket, getBookedSeats } from "../../api/bookingApi";

// --- CSS STYLES (Giao diện Full màn hình & Hiện đại) ---
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');

  :root {
    --primary-blue: #2474E5;
    --primary-dark: #1e3a8a;
    --primary-yellow: #FFC700;
    --text-color: #484848;
    --gray-bg: #F2F4F6;
    --green-badge: #00B603;
    --seat-available: #DEF3FF;
    --seat-booked: #E0E0E0;
    --seat-selected: #FFC700;
  }

  body { font-family: 'Roboto', sans-serif; background-color: var(--gray-bg); color: var(--text-color); margin: 0; overflow-x: hidden; }
  ::-webkit-scrollbar { display: none; }
  
  /* HERO SECTION */
  .hero-container { 
    
    background-size: cover; 
    min-height: 420px; 
    position: relative; 
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding-bottom: 40px;
  }
  
  
  .banner-text { position: relative; z-index: 2; text-align: center; color: white; margin-bottom: 30px; }
  .banner-title { font-size: 3rem; font-weight: 800; text-shadow: 0 4px 10px rgba(0,0,0,0.3); margin: 0; letter-spacing: -1px; }
  .banner-sub { font-size: 1.1rem; margin-top: 15px; background: rgba(255,255,255,0.2); padding: 8px 20px; border-radius: 30px; backdrop-filter: blur(5px); display: inline-block; }
  
  /* SEARCH BOX */
  .search-box-wrapper { 
    position: relative; z-index: 10; background:; border-radius: 16px; 
    box-shadow: 0 10px 40px rgba(0,0,0,0.15); width: 95%; max-width: 1500px; overflow: hidden; 
  }
  .search-tabs { display: flex; border-bottom: 1px solid #eee;  }
  .search-tab { flex: 1; padding: 18px; text-align: center; cursor: pointer; font-weight: 600; color: #666; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
  .search-tab:hover { background:; }
  .search-tab.active { color: var(--primary-blue); border-bottom: 3px solid var(--primary-blue); background: white; }
  
  .search-inputs { display: flex; padding: 25px; gap: 20px; align-items: center; flex-wrap: wrap; }
  .input-group { flex: 1; border: 1px solid #e0e0e0; border-radius: 10px; padding: 12px 18px; display: flex; flex-direction: column; min-width: 200px; transition: border 0.2s; background: white; }
  .input-group:focus-within { border-color: var(--primary-blue); box-shadow: 0 0 0 3px rgba(36, 116, 229, 0.1); }
  .input-label { font-size: 12px; color: #888; margin-bottom: 5px; font-weight: 500; text-transform: uppercase; }
  .custom-select, .custom-input { border: none; outline: none; font-size: 16px; font-weight: 700; width: 100%; color: #222; background: transparent; cursor: pointer; }
  
  .search-btn { 
    background: var(--primary-yellow); color: #111; border: none; padding: 0 50px; height: 65px; 
    border-radius: 10px; font-weight: 800; font-size: 18px; cursor: pointer; transition: all 0.2s; 
    box-shadow: 0 5px 15px rgba(255, 199, 0, 0.3);
  }
  .search-btn:hover { transform: translateY(-3px); background: #ffda33; box-shadow: 0 8px 20px rgba(255, 199, 0, 0.4); }

  /* MAIN LAYOUT */
  .main-container {
    width: 100%; padding: 10px 40px; box-sizing: border-box;
    display: flex; gap: 30px; align-items: flex-start;
    height: calc(100vh - 100px); 
    overflow: hidden; 
  }

  /* SIDEBAR */
  .sidebar { 
    width: 300px; flex-shrink: 0; display: flex; flex-direction: column; gap: 20px;
    height: 100%; 
    overflow-y: auto; 
    padding-right: 5px;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
  }
  .sidebar::-webkit-scrollbar { display: none; }

  .filter-box { background: white; padding: 25px; border-radius: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.05); }
  .filter-header { font-weight: 800; font-size: 17px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; color: #222; }
  .clear-btn { font-size: 13px; color: var(--primary-blue); cursor: pointer; font-weight: 600; text-decoration: underline; }
  .filter-group { display: flex; flex-direction: column; gap: 12px; }
  .filter-item { display: flex; align-items: center; cursor: pointer; font-size: 15px; color: #444; transition: color 0.2s; }
  .filter-item:hover { color: var(--primary-blue); }
  .filter-checkbox { margin-right: 12px; width: 18px; height: 18px; accent-color: var(--primary-blue); cursor: pointer; }
  .badge-count { margin-left: auto; font-size: 12px; background: #f0f2f5; padding: 3px 8px; border-radius: 12px; color: #666; font-weight: 600; }

  /* TRIP LIST (SCROLLABLE) */
  .trip-column { 
    flex: 1; min-width: 0; 
    height: 100%; 
    overflow-y: auto; 
    padding-right: 15px; padding-bottom: 50px;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE/Edge */
  }
  .trip-column::-webkit-scrollbar { display: none; }

  .trip-list-header {
    font-size: 20px;
    font-weight: 800;
    margin-bottom: 20px;
    color: #222;
    position: sticky;
    top: 0;
    background: var(--gray-bg);
    z-index: 5;
    
    /* --- Các phần thêm mới --- */
    border-radius: 12px;       /* Bo tròn 12px (bạn có thể chỉnh số này) */
    padding: 10px 15px;        /* Thêm padding 2 bên để chữ không bị lẹm vào góc bo */
    
    /* Tùy chọn: Thêm bóng nhẹ để nổi bật hơn khi sticky */
    /* box-shadow: 0 4px 6px rgba(0,0,0,0.05); */
}
  /* TRIP CARD */
  .trip-card { 
    background: white; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); 
    display: flex; margin-bottom: 25px; overflow: hidden; transition: all 0.2s;
    border: 1px solid rgba(0,0,0,0.05); min-height: 220px; flex-shrink: 0;
  }
  .trip-card:hover { box-shadow: 0 10px 25px rgba(0,0,0,0.1); transform: translateY(-2px); border-color: rgba(36, 116, 229, 0.2); }
  
  .card-left { width: 280px; position: relative; flex-shrink: 0; }
  .card-img { width: 100%; height: 100%; object-fit: cover; }
  .badge-instant { position: absolute; top: 15px; left: 15px; background: var(--green-badge); color: white; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 6px; box-shadow: 0 4px 10px rgba(0,182,3,0.3); }
  
  .card-middle { flex: 1; padding: 25px 30px; display: flex; flex-direction: column; justify-content: center; border-right: 1px dashed #e0e0e0; }
  .bus-title { font-size: 20px; font-weight: 800; color: #222; margin-bottom: 8px; display: flex; align-items: center; gap: 10px; }
  .rating-badge { background: #eef4ff; color: var(--primary-blue); font-size: 13px; padding: 4px 8px; border-radius: 6px; font-weight: 700; }
  .bus-type { font-size: 14px; color: #666; margin-bottom: 25px; background: #f5f7fa; display: inline-block; padding: 6px 12px; border-radius: 6px; font-weight: 500; }
  
  .timeline { padding-left: 20px; border-left: 2px dashed #d0d7de; margin-left: 8px; position: relative; }
  .timeline-item { position: relative; margin-bottom: 25px; }
  .timeline-item:last-child { margin-bottom: 0; }
  .dot { position: absolute; left: -27px; top: 5px; width: 12px; height: 12px; border-radius: 50%; background: white; border: 4px solid #cbd5e1; }
  .dot.start { border-color: var(--primary-blue); } .dot.end { border-color: #F44336; }
  .time-loc { display: flex; gap: 20px; align-items: center; }
  .time { font-size: 22px; font-weight: 800; color: #222; width: 80px; }
  .loc { font-size: 16px; color: #555; font-weight: 600; }
  .duration { font-size: 13px; color: #888; margin: -12px 0 8px 100px; font-weight: 500; }

  .card-right { width: 240px; padding: 25px; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end; text-align: right; background: #fcfcfc; }
  .price-text { font-size: 28px; font-weight: 800; color: var(--primary-blue); letter-spacing: -0.5px; }
  .price-sub { font-size: 12px; color: #888; margin-bottom: auto; font-weight: 500; }
  .seats-left { font-size: 13px; color: #e67e22; font-weight: 700; margin-bottom: 12px; background: #fff8f0; padding: 5px 10px; border-radius: 4px; }
  
  .btn-select { background: var(--primary-yellow); color: #111; font-weight: 800; border: none; padding: 15px 20px; border-radius: 10px; cursor: pointer; width: 100%; font-size: 16px; transition: all 0.2s; box-shadow: 0 4px 10px rgba(255, 199, 0, 0.25); }
  .btn-select:hover { background: #ffda33; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(255, 199, 0, 0.35); }
  .detail-link { color: var(--primary-blue); font-size: 14px; margin-top: 15px; text-align: center; cursor: pointer; font-weight: 700; transition: all 0.2s; width: 100%; }
  .detail-link:hover { text-decoration: underline; color: #1a5bb5; }

  /* MODALS */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(5px); }
  .modal-content { background: white; width: 850px; max-width: 95vw; border-radius: 20px; box-shadow: 0 25px 50px rgba(0,0,0,0.25); display: flex; flex-direction: column; max-height: 90vh; overflow: hidden; animation: zoomIn 0.3s ease; }
  @keyframes zoomIn { from {opacity:0; transform:scale(0.95);} to {opacity:1; transform:scale(1);} }
  .modal-header { padding: 20px 30px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center; background: #fff; }
  .modal-title { margin: 0; font-size: 20px; color: #222; font-weight: 800; }
  .modal-body { padding: 30px; overflow-y: auto; flex: 1; background: #fafafa; }
  
  .bus-container { display: flex; justify-content: center; gap: 60px; margin-bottom: 20px; }
  .floor-section { background: #fff; border: 2px solid #eee; border-radius: 24px; padding: 20px; width: 180px; text-align: center; position: relative; box-shadow: 0 10px 20px rgba(0,0,0,0.03); }
  .floor-title { margin-bottom: 20px; font-weight: 800; color: #aaa; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
  .driver-wheel { width: 50px; height: 50px; border: 5px solid #e0e0e0; border-radius: 50%; margin: 0 auto 30px auto; position: relative; }
  .seat-grid { display: grid; grid-template-columns: 1fr 40px 1fr; gap: 15px 0; }
  
  .seat-item { height: 55px; width: 45px; margin: 0 auto; border-radius: 8px 8px 16px 16px; border: 1px solid #d0d7de; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; cursor: pointer; position: relative; box-shadow: 0 4px 0 #d0d7de; transition: all 0.15s; background: white; color: #666; }
  .seat-item.available:hover { transform: translateY(-4px); box-shadow: 0 8px 0 #d0d7de; }
  .seat-item.booked { background: #e2e8f0; border-color: #cbd5e1; color: #94a3b8; box-shadow: none; cursor: not-allowed; transform: translateY(2px); }
  .seat-item.selected { background: var(--primary-yellow); border-color: #e6b400; color: #111; box-shadow: 0 4px 0 #e6b400; transform: translateY(-2px); }

  .booking-form { border-top: 1px solid #f0f0f0; padding: 25px 30px; background: #fff; }
  .booking-row { display: flex; gap: 20px; margin-bottom: 20px; }
  .form-input { flex: 1; padding: 15px; border: 2px solid #f0f2f5; border-radius: 12px; outline: none; font-size: 15px; font-weight: 500; transition: border 0.2s; }
  .form-input:focus { border-color: var(--primary-blue); background: #fff; }

  @media (max-width: 1024px) {
    .main-container { padding: 20px; flex-direction: column; height: auto; overflow: visible; }
    .sidebar { width: 100%; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; height: auto; }
    .trip-column { height: auto; overflow-y: visible; padding-right: 0; }
    .trip-card { flex-direction: column; height: auto; }
    .card-left { width: 100%; height: 200px; }
    .card-middle { border-right: none; border-bottom: 1px dashed #e0e0e0; }
    .card-right { width: 100%; border-left: none; flex-direction: row; justify-content: space-between; align-items: center; padding: 20px 30px; box-sizing: border-box; }
    .btn-select { width: auto; }
  }
`;

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
  maTai?: string;
  loaiXe?: string;
  hangXe?: string;
  mauSac?: string;
  soLuongGhe?: number;
  trangThai?: string;
  tienIch?: string;
  tongSoGhe?: number;
  availableSeats?: number;
  bookedSeatCount?: number;
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
].sort();

// ✅ MAPPING TÊN NHÀ XE
const NHA_XE_MAPPING: Record<string, string> = {
  "yft1Ag1eaRf3uCigXyCJLpmu9R42": "Phúc Yên",
  "SFbbzut0USTG5F6ZM3COrLXKGS93": "Cúc Tư",
  "BuPwvEMgfCNEDbz2VNKx5hnpBT52": "Hồng Sơn",
  "U5XWQ12kL8VnyQ0ovZTvUZLdJov1": "Nhật Tân"
};
const getNhaXeName = (id: string) => NHA_XE_MAPPING[id] || id;

export default function SearchTrip() {
  const [trips, setTrips] = useState<Trip[]>([]);
  
  // State tìm kiếm cơ bản (giữ logic cũ cho inputs)
  const [searchInputs, setSearchInputs] = useState({ tu: "", den: "", ngayKhoiHanh: "" });
  const [appliedSearch, setAppliedSearch] = useState({ tu: "", den: "", ngayKhoiHanh: "" });

  // State bộ lọc Sidebar
  const [sortBy, setSortBy] = useState("default");
  const [filterOperators, setFilterOperators] = useState<string[]>([]);
  const [filterTime, setFilterTime] = useState<string[]>([]);

  // State Booking (Giữ nguyên)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [bookedSeats, setBookedSeats] = useState<number[]>([]);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hoTen, setHoTen] = useState("");
  const [sdt, setSdt] = useState("");
  const pollingRef = useRef<number | null>(null);

  // --- LOGIC: FETCH DATA (GIỮ NGUYÊN) ---
  const fetchTrips = async () => {
    try {
      const data = await getAllTrips();
      setTrips(data);
    } catch (error) {
      console.error("Lỗi tải chuyến:", error);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  // --- LOGIC: FETCH BOOKED SEATS (GIỮ NGUYÊN) ---
  const fetchBookedSeatsData = async (tripId: string) => {
    try {
      const bookedSeatsStrings = await getBookedSeats(tripId);
      const bookedSeatsNumbers = bookedSeatsStrings
        .map((seat: any) => Number(seat))
        .filter((n: number) => Number.isFinite(n) && n > 0);
      const uniqueBookedSeats = Array.from(new Set(bookedSeatsNumbers)).sort((a: number, b: number) => a - b);
      setBookedSeats(uniqueBookedSeats);
    } catch (error) {
      console.error("Lỗi tải ghế đã đặt:", error);
      setBookedSeats([]);
    }
  };

  // --- LOGIC: CONFIRM BOOKING (GIỮ NGUYÊN THEO YÊU CẦU) ---
  const handleConfirmBooking = async () => {
    if (!selectedTrip || selectedSeats.length === 0)
      return alert("❌ Vui lòng chọn ghế trước khi đặt!");

    if (!hoTen.trim() || !sdt.trim())
      return alert("⚠️ Vui lòng nhập đầy đủ họ tên và số điện thoại!");

    if (!/^[0-9]{9,11}$/.test(sdt))
      return alert("⚠️ Số điện thoại không hợp lệ! (9–11 chữ số)");

    try {
      // Kiểm tra lại ghế trước khi đặt
      const latestStrings = await getBookedSeats(selectedTrip._id!);
      const latestBooked: number[] = latestStrings
        .map((seat: any) => Number(seat))
        .filter((n: number) => Number.isFinite(n) && n > 0);
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

  // Polling ghế (Giữ nguyên)
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

  const handleBookTrip = async (trip: Trip) => {
    setSelectedTrip(trip); setSelectedSeats([]); setShowSeatModal(true);
    await fetchBookedSeatsData(trip._id!);
  };

  const handleSearchClick = () => setAppliedSearch(searchInputs);

  // --- LOGIC LỌC & SẮP XẾP MỚI (Dùng useMemo để tối ưu) ---
  const displayedTrips = useMemo(() => {
    let result = trips.filter(trip => {
      const matchTu = appliedSearch.tu ? trip.tu.toLowerCase().includes(appliedSearch.tu.toLowerCase()) : true;
      const matchDen = appliedSearch.den ? trip.den.toLowerCase().includes(appliedSearch.den.toLowerCase()) : true;
      const matchNgay = appliedSearch.ngayKhoiHanh ? trip.ngayKhoiHanh?.startsWith(appliedSearch.ngayKhoiHanh) : true;
      return matchTu && matchDen && matchNgay;
    });

    if (filterOperators.length > 0) result = result.filter(trip => filterOperators.includes(trip.nhaXe));
    
    if (filterTime.length > 0) {
      result = result.filter(trip => {
        const h = parseInt(trip.gioKhoiHanh?.split(':')[0] || "0");
        let period = "";
        if (h >= 0 && h < 6) period = "night";
        else if (h >= 6 && h < 12) period = "morning";
        else if (h >= 12 && h < 18) period = "afternoon";
        else period = "evening";
        return filterTime.includes(period);
      });
    }

    if (sortBy === "price_asc") result.sort((a, b) => a.giaVe - b.giaVe);
    else if (sortBy === "price_desc") result.sort((a, b) => b.giaVe - a.giaVe);
    else if (sortBy === "time_asc") result.sort((a, b) => (a.gioKhoiHanh||"").localeCompare(b.gioKhoiHanh||""));

    return result;
  }, [trips, appliedSearch, filterOperators, filterTime, sortBy]);

  const availableOperators = useMemo(() => [...new Set(trips.map(t => t.nhaXe))], [trips]);

  // --- RENDER SEAT MAP HELPER ---
  const renderSeatMap = (trip: Trip) => {
    const total = trip.tongSoGhe || 20;
    const isSingle = total <= 16;
    const perFloor = isSingle ? total : Math.ceil(total / 2);

    const renderFloor = (start: number, end: number, label: string) => {
      let rows = [];
      for (let i = start; i < end; i += 2) {
        const left = i + 1; const right = left + 1 <= end ? left + 1 : null;
        rows.push(
          <div key={i} style={{ display: "contents" }}>
            <div className={`seat-item ${bookedSeats.includes(left)?'booked':selectedSeats.includes(left)?'selected':'available'}`}
                 onClick={()=>!bookedSeats.includes(left) && setSelectedSeats(p=>p.includes(left)?p.filter(x=>x!==left):[...p,left])}>{left}</div>
            <div></div>
            {right ? <div className={`seat-item ${bookedSeats.includes(right)?'booked':selectedSeats.includes(right)?'selected':'available'}`}
                 onClick={()=>!bookedSeats.includes(right) && setSelectedSeats(p=>p.includes(right)?p.filter(x=>x!==right):[...p,right])}>{right}</div> : <div></div>}
          </div>
        );
      }
      return <div className="floor-section"><div className="floor-title">{label}</div><div className="driver-wheel"></div><div className="seat-grid">{rows}</div></div>;
    };
    return <div className="bus-container">{renderFloor(0, perFloor, isSingle?"Sơ đồ":"Tầng 1")}{!isSingle && renderFloor(perFloor, total, "Tầng 2")}</div>;
  };

  return (
    <div>
      <style>{styles}</style>

      {/* HEADER & HERO */}
      <div className="hero-container">
        <div className="hero-overlay"></div>
        <div className="banner-text">
          <h1 className="banner-title">Hành trình vạn dặm</h1>
          <div className="banner-sub">Hệ thống vé xe khách lớn nhất Việt Nam</div>
        </div>

        <div className="search-box-wrapper">
          <div className="search-tabs"><div className="search-tab active">🚌 Xe khách</div></div>
          <div className="search-inputs">
            <div className="input-group">
              <label className="input-label">Nơi đi</label>
              <select className="custom-select" value={searchInputs.tu} onChange={e=>setSearchInputs({...searchInputs, tu:e.target.value})}>
                <option value="">Tất cả</option>{provinces.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Nơi đến</label>
              <select className="custom-select" value={searchInputs.den} onChange={e=>setSearchInputs({...searchInputs, den:e.target.value})}>
                <option value="">Tất cả</option>{provinces.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Ngày đi</label>
              <input type="date" className="custom-input" value={searchInputs.ngayKhoiHanh} onChange={e=>setSearchInputs({...searchInputs, ngayKhoiHanh:e.target.value})}/>
            </div>
            <button onClick={handleSearchClick} className="search-btn">Tìm kiếm</button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-container">
        
        {/* --- SIDEBAR --- */}
        <div className="sidebar">
          <div className="filter-box">
            <div className="filter-header">Sắp xếp</div>
            <div className="filter-group">
              <label className="filter-item"><input type="radio" name="sort" className="filter-checkbox" checked={sortBy==='default'} onChange={()=>setSortBy('default')}/> Mặc định</label>
              <label className="filter-item"><input type="radio" name="sort" className="filter-checkbox" checked={sortBy==='price_asc'} onChange={()=>setSortBy('price_asc')}/> Giá tăng dần</label>
              <label className="filter-item"><input type="radio" name="sort" className="filter-checkbox" checked={sortBy==='price_desc'} onChange={()=>setSortBy('price_desc')}/> Giá giảm dần</label>
              <label className="filter-item"><input type="radio" name="sort" className="filter-checkbox" checked={sortBy==='time_asc'} onChange={()=>setSortBy('time_asc')}/> Giờ đi sớm nhất</label>
            </div>
          </div>

          <div className="filter-box">
            <div className="filter-header">Giờ đi {filterTime.length>0 && <span className="clear-btn" onClick={()=>setFilterTime([])}>Xóa</span>}</div>
            <div className="filter-group">
              {[
                {k:'night', l:'Sáng sớm (00-06h)'}, {k:'morning', l:'Buổi sáng (06-12h)'},
                {k:'afternoon', l:'Buổi chiều (12-18h)'}, {k:'evening', l:'Buổi tối (18-24h)'}
              ].map(t => (
                <label key={t.k} className="filter-item">
                  <input type="checkbox" className="filter-checkbox" checked={filterTime.includes(t.k)} 
                    onChange={()=>setFilterTime(p=>p.includes(t.k)?p.filter(x=>x!==t.k):[...p,t.k])} />
                  {t.l}
                </label>
              ))}
            </div>
          </div>

          <div className="filter-box">
            <div className="filter-header">Nhà xe {filterOperators.length>0 && <span className="clear-btn" onClick={()=>setFilterOperators([])}>Xóa</span>}</div>
            <div className="filter-group" style={{maxHeight:200, overflowY:'auto'}}>
              {availableOperators.map(op => (
                <label key={op} className="filter-item">
                  <input type="checkbox" className="filter-checkbox" checked={filterOperators.includes(op)}
                    onChange={()=>setFilterOperators(p=>p.includes(op)?p.filter(x=>x!==op):[...p,op])} />
                  {getNhaXeName(op)} <span className="badge-count">{trips.filter(t=>t.nhaXe===op).length}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* --- TRIP LIST --- */}
        <div className="trip-column">
          <div className="trip-list-header">Kết quả hiển thị ({displayedTrips.length} chuyến)</div>

          {displayedTrips.length === 0 ? (
            <div style={{textAlign: "center", padding: "50px", background: "white", borderRadius: 16, boxShadow: "0 5px 20px rgba(0,0,0,0.05)"}}>
              <div style={{fontSize: 50}}>🚍</div>
              <h3>Không tìm thấy chuyến xe nào.</h3>
              <p style={{color: "#666"}}>Hãy thử thay đổi tiêu chí tìm kiếm của bạn.</p>
            </div>
          ) : (
            displayedTrips.map(trip => (
              <div key={trip._id} className="trip-card">
                <div className="card-left">
                   <img src={trip.hinhAnh || "https://via.placeholder.com/300x200?text=No+Image"} alt={trip.nhaXe} className="card-img" />
                   <div className="badge-instant">⚡ Xác nhận tức thì</div>
                </div>

                <div className="card-middle">
                   <div style={{fontSize: '13px', color: '#64748b', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>{trip.tenChuyen}</div>
                   <div className="bus-title">{getNhaXeName(trip.nhaXe)} <span className="rating-badge">★ 4.8</span></div>
                   
                   <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px'}}>
                      <div className="bus-type">{trip.loaiXe || "Ghế ngồi"}</div>
                      <div className="bus-type" style={{background: '#eff6ff', color: '#2563eb'}}>📅 {trip.ngayKhoiHanh}</div>
                      {trip.hangXe && <div className="bus-type" style={{background: '#fff7ed', color: '#ea580c'}}>🚌 {trip.hangXe}</div>}
                      {trip.maTai && <div className="bus-type" style={{background: '#f0fdf4', color: '#16a34a'}}>🚗 {trip.maTai}</div>}
                      {trip.mauSac && <div className="bus-type" style={{background: '#f8fafc', color: '#475569'}}>🎨 {trip.mauSac}</div>}
                   </div>

                   <div className="timeline">
                      <div className="timeline-item"><div className="dot start"></div><div className="time-loc"><span className="time">{trip.gioKhoiHanh}</span><span className="loc">• {trip.tu}</span></div></div>
                      <div className="duration">~ 5h 30m • Đường cao tốc</div>
                      <div className="timeline-item"><div className="dot end"></div><div className="time-loc"><span className="time">--:--</span><span className="loc">• {trip.den}</span></div></div>
                   </div>

                   <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #e2e8f0', display: 'flex', gap: '15px', flexWrap: 'wrap'}}>
                      {(trip.tienIch ? trip.tienIch.split(/[,·]/) : ["Wifi", "Nước uống", "Điều hòa"]).map((u, i) => (
                        <span key={i} style={{fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500}}>
                          <span style={{color: '#10b981'}}>✓</span> {u.trim()}
                        </span>
                      ))}
                   </div>
                </div>

                <div className="card-right">
                   <div className="price-text">{trip.giaVe.toLocaleString()}đ</div>
                   <div className="price-sub">đã gồm VAT</div>
                   
                   <div style={{width: "100%", margin: "15px 0"}}>
                      <div style={{display:"flex", alignItems:"center", gap:5, marginBottom:5}}>
                        <span style={{color:"var(--primary-blue)"}}>🎫</span>
                        <span style={{fontSize: 13, color: "#64748b", fontWeight: 500}}>Ghế đã đặt</span>
                      </div>
                      <div style={{fontSize: 16, fontWeight: 800, color: "#334155", marginBottom: 8}}>
                        {trip.bookedSeatCount ?? 0}/{trip.tongSoGhe || trip.soLuongGhe || 20} ghế
                      </div>
                      <div style={{width: "100%", height: 8, background: "#e2e8f0", borderRadius: 4, overflow: "hidden"}}>
                        <div style={{
                          width: `${((trip.bookedSeatCount ?? 0) / (trip.tongSoGhe || trip.soLuongGhe || 20)) * 100}%`, 
                          height: "100%", 
                          background: "var(--primary-blue)", 
                          borderRadius: 4
                        }}></div>
                      </div>
                   </div>

                   <div style={{width:"100%", marginTop:"auto"}}>
                     <button onClick={()=>handleBookTrip(trip)} className="btn-select">Chọn chuyến</button>
                     <div className="detail-link" onClick={()=>{setSelectedTrip(trip); setShowDetailModal(true); fetchBookedSeatsData(trip._id!)}}>Xem chi tiết vé</div>
                   </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* --- MODAL CHI TIẾT --- */}
      {showDetailModal && selectedTrip && (
        <div className="modal-overlay" onClick={()=>setShowDetailModal(false)}>
           <div className="modal-content" style={{width: 600}} onClick={e=>e.stopPropagation()}>
              <div className="modal-header"><h3 className="modal-title">{getNhaXeName(selectedTrip.nhaXe)}</h3><span style={{cursor:"pointer", fontSize:24}} onClick={()=>setShowDetailModal(false)}>✕</span></div>
              <div className="modal-body">
                 <img src={selectedTrip.hinhAnh || "https://via.placeholder.com/600x300"} style={{width:"100%", height:250, objectFit:"cover", borderRadius:12, marginBottom:20}} alt=""/>
                 <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20}}>
                    <p><strong>Tuyến:</strong> {selectedTrip.tu} - {selectedTrip.den}</p>
                    <p><strong>Ngày:</strong> {selectedTrip.ngayKhoiHanh} - {selectedTrip.gioKhoiHanh}</p>
                    <p><strong>Loại xe:</strong> {selectedTrip.loaiXe}</p>
                    <p><strong>Biển số:</strong> {selectedTrip.maTai || "Đang cập nhật"}</p>
                 </div>
                 <div style={{background:"#f1f5f9", padding:15, borderRadius:10}}>
                    <strong>Tiện ích:</strong>
                    <div style={{display:"flex", flexWrap:"wrap", gap:10, marginTop:10}}>
                       {(selectedTrip.tienIch ? selectedTrip.tienIch.split("·") : ["Wifi", "Nước uống", "Điều hòa"]).map((u,i)=>(
                          <span key={i} style={{background:"white", padding:"5px 10px", borderRadius:5, fontSize:13}}>{u}</span>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL CHỌN GHẾ (LOGIC CŨ) --- */}
      {showSeatModal && selectedTrip && (
        <div className="modal-overlay">
           <div className="modal-content">
              <div className="modal-header"><h3 className="modal-title">Chọn ghế: {getNhaXeName(selectedTrip.nhaXe)}</h3><span style={{cursor:"pointer", fontSize:24}} onClick={()=>setShowSeatModal(false)}>✕</span></div>
              <div className="modal-body">
                 <div style={{textAlign:"center", marginBottom:20, display:"flex", justifyContent:"center", gap:20, fontSize:14, fontWeight:500}}>
                   <span style={{display:"flex", alignItems:"center", gap:5}}><div style={{width:15, height:15, border:"1px solid #ccc", borderRadius:4}}></div> Trống</span> 
                   <span style={{display:"flex", alignItems:"center", gap:5}}><div style={{width:15, height:15, background:"#e2e8f0", borderRadius:4}}></div> Đã đặt</span> 
                   <span style={{display:"flex", alignItems:"center", gap:5}}><div style={{width:15, height:15, background:"#FFC700", borderRadius:4}}></div> Đang chọn</span>
                 </div>
                 {renderSeatMap(selectedTrip)}
              </div>
              <div className="booking-form">
                 <div className="booking-row">
                    <input className="form-input" placeholder="Họ và tên hành khách" value={hoTen} onChange={e=>setHoTen(e.target.value)}/>
                    <input className="form-input" placeholder="Số điện thoại" value={sdt} onChange={e=>setSdt(e.target.value)}/>
                 </div>
                 <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", background:"#f8f9fa", padding:15, borderRadius:12}}>
                    <div>
                        <div style={{fontSize:14, color:"#666"}}>Tổng thanh toán</div>
                        <div style={{fontSize:24, fontWeight:800, color:"#2474E5"}}>{(selectedSeats.length*selectedTrip.giaVe).toLocaleString()}đ</div>
                        <div style={{fontSize:13}}>cho <b>{selectedSeats.length}</b> vé</div>
                    </div>
                    {/* BUTTON VẪN GỌI HÀM CONFIRM BOOKING CŨ */}
                    <button onClick={handleConfirmBooking} disabled={loading} style={{background:"#2474E5", color:"white", border:"none", padding:"15px 40px", borderRadius:10, fontWeight:"bold", cursor:"pointer", fontSize:16, boxShadow:"0 5px 15px rgba(36, 116, 229, 0.3)", opacity: loading ? 0.7 : 1}}>
                      {loading ? "Đang xử lý..." : "Xác nhận đặt vé"}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}