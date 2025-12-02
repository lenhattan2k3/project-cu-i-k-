import './App.css'

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Register from "./auth/Register";
import Login from "./auth/login";
import HomeUser from "./home/homeuser";
import HomePartner from "./home/homepartner";
import HomeAdmin from "./home/homeadmin";
import LandingPage from "./LandingPage"; // Import LandingPage
import PaymentSuccess from "./home/components/PaymentSuccess";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} /> {/* Chuyển đến LandingPage */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/homeuser/*" element={<HomeUser />} />
        <Route path="/homepartner/*" element={<HomePartner />} />
        <Route path="/homeadmin" element={<HomeAdmin />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
      </Routes>
    </BrowserRouter>
  );
}
