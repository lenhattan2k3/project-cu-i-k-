import React, { useState } from "react";
import axios from "axios";

export default function BookTicket() {
  const [tripId, setTripId] = useState("");
  const [hoTen, setHoTen] = useState("");
  const [sdt, setSdt] = useState("");
  const [soGhe, setSoGhe] = useState<number[]>([]);
  const [message, setMessage] = useState("");

  // Gọi API backend
  const bookTicket = async (data: {
    tripId: string;
    hoTen: string;
    sdt: string;
    soGhe: number[];
  }) => {
    return await axios.post("http://localhost:5000/api/bookings/book", data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("⏳ Đang xử lý...");

    try {
      const res = await bookTicket({ tripId, hoTen, sdt, soGhe });
      setMessage("✅ " + res.data.message);
    } catch (err: any) {
      setMessage("❌ " + (err.response?.data?.message || "Lỗi đặt vé!"));
    }
  };

  return (
    <div
      style={{
        maxWidth: 400,
        margin: "50px auto",
        padding: 20,
        borderRadius: 10,
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        fontFamily: "sans-serif",
      }}
    >
      <h2 style={{ textAlign: "center" }}>🚌 Đặt vé xe</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: 10 }}
      >
        <label>Mã chuyến (Trip ID):</label>
        <input
          value={tripId}
          onChange={(e) => setTripId(e.target.value)}
          required
          placeholder="Nhập ID chuyến xe"
        />

        <label>Họ tên:</label>
        <input
          value={hoTen}
          onChange={(e) => setHoTen(e.target.value)}
          required
          placeholder="Nhập họ tên hành khách"
        />

        <label>Số điện thoại:</label>
        <input
          value={sdt}
          onChange={(e) => setSdt(e.target.value)}
          required
          placeholder="Nhập số điện thoại"
        />

        <label>Số ghế (vd: 5,6,7):</label>
        <input
          value={soGhe.join(",")}
          onChange={(e) =>
            setSoGhe(
              e.target.value
                .split(",")
                .map((n) => Number(n.trim()))
                .filter((n) => !isNaN(n))
            )
          }
          placeholder="Nhập số ghế, cách nhau bằng dấu phẩy"
        />

        <button
          type="submit"
          style={{
            marginTop: 10,
            padding: "10px",
            backgroundColor: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          Đặt vé
        </button>
      </form>
      <p
        style={{
          marginTop: 15,
          textAlign: "center",
          color: message.startsWith("✅") ? "green" : "red",
        }}
      >
        {message}
      </p>
    </div>
  );
}
