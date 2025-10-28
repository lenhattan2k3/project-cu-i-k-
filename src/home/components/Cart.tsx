import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Cart() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user?._id;

  useEffect(() => {
    if (userId) fetchUserBookings();
    else setMessage("⚠️ Vui lòng đăng nhập!");
  }, [userId]);

  const fetchUserBookings = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await axios.get(`http://localhost:5000/api/bookings/user/${userId}`);
      if (!res.data || res.data.length === 0) {
        setMessage("📭 Bạn chưa đặt vé nào!");
        setBookings([]);
      } else {
        setBookings(res.data);
      }
    } catch (err) {
      console.error(err);
      setMessage("⚠️ Lỗi khi tải vé!");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn hủy vé không?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/bookings/${id}`);
      fetchUserBookings();
    } catch {
      setMessage("⚠️ Lỗi khi hủy vé!");
    }
  };

  const handleUpdateStatus = async (id: string) => {
    try {
      await axios.patch(`http://localhost:5000/api/bookings/status/${id}`, { status: "paid" });
      fetchUserBookings();
    } catch {
      setMessage("⚠️ Lỗi khi cập nhật trạng thái!");
    }
  };

  const getImageUrl = (img?: string) => img ? `http://localhost:5000${img}` : "/images/no-image.png";

  return (
    <div style={{ padding:"60px 20px" }}>
      <h2>🎟️ Vé Đã Đặt Của Bạn</h2>

      {loading && <p>⏳ Đang tải...</p>}
      {message && <p>{message}</p>}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:"20px" }}>
        {bookings.map(b => (
          <div key={b._id} style={{ padding:20, border:"1px solid #ccc", borderRadius:10 }}>
            <img src={getImageUrl(b.tripId?.hinhAnh)} alt={b.tripId?.tenChuyen} style={{ width:"100%", height:180, objectFit:"cover" }} />
            <h3>{b.tripId?.tenChuyen}</h3>
            <p>🗓️ {b.tripId?.ngayKhoiHanh} - {b.tripId?.gioKhoiHanh}</p>
            <p>💺 Ghế: {b.soGhe.join(", ")}</p>
            <p>💰 {b.totalPrice.toLocaleString()}₫</p>
            <p>Trạng thái: {b.status}</p>

            {b.status !== "cancelled" && (
              <div style={{ display:"flex", gap:10, marginTop:10 }}>
                <button onClick={()=>handleCancel(b._id)} style={{ flex:1, background:"#ef4444", color:"#fff" }}>❌ Hủy vé</button>
                {b.status !== "paid" && <button onClick={()=>handleUpdateStatus(b._id)} style={{ flex:1, background:"#22c55e", color:"#fff" }}>💳 Thanh toán</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
