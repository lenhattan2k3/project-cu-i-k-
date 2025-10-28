import React, { useState } from "react";

export default function PartnerProfile() {
  const [profile, setProfile] = useState({
    name: "Nhà xe Minh Tân",
    email: "minhtan@vexe.vn",
    phone: "0987 654 321",
    company: "Công ty TNHH Minh Tân",
    paymentMethod: "Momo / Banking",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    alert("✅ Thông tin đã được cập nhật!");
  };

  return (
    <div className="p-8 bg-white shadow-md rounded-2xl max-w-3xl mx-auto mt-8">
      <h2 className="text-2xl font-bold text-blue-600 mb-6">
        🧾 Hồ sơ Nhà xe
      </h2>
      <div className="space-y-4">
        {["name", "email", "phone", "company", "paymentMethod"].map((field) => (
          <input
            key={field}
            name={field}
            value={(profile as any)[field]}
            onChange={handleChange}
            placeholder={field}
            className="w-full p-3 border rounded-xl"
          />
        ))}
      </div>
      <button
        onClick={handleSave}
        className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        Lưu thay đổi
      </button>
    </div>
  );
}
