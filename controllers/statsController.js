// 📁 controllers/statsController.js
import Booking from "../models/Booking.js";
import Trip from "../models/tripModel.js";
import Review from "../models/Review.js";
import { Point } from "../models/pointModel.js";

const toStartOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toEndOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const buildDateRange = (query = {}) => {
  const { date, startDate, endDate } = query;
  const periodRaw = query.period || query.timeframe;
  const period = typeof periodRaw === "string" ? periodRaw.toLowerCase() : undefined;

  if (startDate && endDate) {
    const start = toStartOfDay(new Date(startDate));
    const end = toEndOfDay(new Date(endDate));
    if (isValidDate(start) && isValidDate(end)) {
      return { start, end, mode: "custom", meta: { start, end } };
    }
  }

  if (!period || period === "all") {
    return null;
  }

  const base = date ? new Date(date) : new Date();
  if (!isValidDate(base)) {
    return null;
  }

  if (period === "day") {
    return {
      start: toStartOfDay(base),
      end: toEndOfDay(base),
      mode: "day",
      meta: { date: toStartOfDay(base) },
    };
  }

  if (period === "month") {
    const year = base.getFullYear();
    const month = base.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    end.setHours(23, 59, 59, 999);

    return {
      start,
      end,
      mode: "month",
      meta: { year, month, daysInMonth: end.getDate() },
    };
  }

  if (period === "year") {
    const year = base.getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);

    return {
      start,
      end,
      mode: "year",
      meta: { year },
    };
  }

  return null;
};

const sumBookingIntoBucket = (bucket, booking) => {
  bucket.revenue += Number(booking.finalTotal || booking.totalPrice) || 0;
  bucket.tickets += booking.soGhe?.length || 0;
};

const buildRevenueData = (bookings, rangeInfo) => {
  const mode = rangeInfo?.mode || "all";

  if (mode === "day") {
    const hourly = Array.from({ length: 24 }, (_, hour) => ({
      label: `${hour.toString().padStart(2, "0")}:00`,
      revenue: 0,
      tickets: 0,
    }));

    bookings.forEach((booking) => {
      const hour = new Date(booking.createdAt || Date.now()).getHours();
      const bucket = hourly[hour];
      if (bucket) {
        sumBookingIntoBucket(bucket, booking);
      }
    });

    return hourly;
  }

  if (mode === "month") {
    const daysInMonth = rangeInfo?.meta?.daysInMonth || 31;
    const daily = Array.from({ length: daysInMonth }, (_, idx) => ({
      label: `D${idx + 1}`,
      revenue: 0,
      tickets: 0,
    }));

    bookings.forEach((booking) => {
      const day = new Date(booking.createdAt || Date.now()).getDate();
      const bucket = daily[day - 1];
      if (bucket) {
        sumBookingIntoBucket(bucket, booking);
      }
    });

    return daily;
  }

  if (mode === "custom") {
    const map = {};
    bookings.forEach((booking) => {
      const key = new Date(booking.createdAt || Date.now()).toISOString().split("T")[0];
      if (!map[key]) {
        map[key] = { label: key, revenue: 0, tickets: 0 };
      }
      sumBookingIntoBucket(map[key], booking);
    });

    return Object.keys(map)
      .sort()
      .map((key) => ({
        label: new Date(key).toLocaleDateString("vi-VN"),
        revenue: map[key].revenue,
        tickets: map[key].tickets,
      }));
  }

  const months = Array.from({ length: 12 }, (_, idx) => ({
    label: `T${idx + 1}`,
    revenue: 0,
    tickets: 0,
  }));

  bookings.forEach((booking) => {
    const month = new Date(booking.createdAt || Date.now()).getMonth();
    const bucket = months[month];
    if (bucket) {
      sumBookingIntoBucket(bucket, booking);
    }
  });

  return months;
};

/* ============================================================
   1) DOANH THU TỔNG THEO PARTNER
============================================================ */
export const getPartnerTotalRevenue = async (req, res) => {
  try {
    const partnerId = req.params.partnerId;

    const bookings = await Booking.find({
      partnerId,
      status: { $in: ["paid", "completed", "done"] },
      paymentMethod: { $in: ["bank", "cash"] }
    });

    const totalRevenue = bookings.reduce((sum, b) => {
      return sum + (Number(b.finalTotal || b.totalPrice) || 0);
    }, 0);

    res.json({
      success: true,
      totalRevenue,
      totalBookings: bookings.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi lấy doanh thu tổng (partner)",
      error: error.message,
    });
  }
};

/* ============================================================
   2) DOANH THU THEO THÁNG (PARTNER)
============================================================ */
export const getPartnerMonthlyRevenue = async (req, res) => {
  try {
    const partnerId = req.params.partnerId;

    const bookings = await Booking.find({
      partnerId,
      status: { $in: ["paid", "completed", "done"] },
    });

    const months = Array(12).fill(0);

    bookings.forEach((b) => {
      const month = new Date(b.createdAt).getMonth();
      months[month] += Number(b.finalTotal || b.totalPrice) || 0;
    });

    res.json({
      success: true,
      monthlyRevenue: months,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi doanh thu tháng (partner)",
      error: error.message,
    });
  }
};

/* ============================================================
   3) DOANH THU THEO NGÀY (PARTNER)
============================================================ */
export const getPartnerDailyRevenue = async (req, res) => {
  try {
    const partnerId = req.params.partnerId;

    const bookings = await Booking.find({
      partnerId,
      status: { $in: ["paid", "completed", "done"] },
    });

    const daily = {};

    bookings.forEach((b) => {
      const day = new Date(b.createdAt).toISOString().split("T")[0];
      daily[day] = (daily[day] || 0) + (Number(b.finalTotal || b.totalPrice) || 0);
    });

    res.json({
      success: true,
      dailyRevenue: daily,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi doanh thu ngày (partner)",
      error: error.message,
    });
  }
};

/* ============================================================
   4) SỐ VÉ ĐÃ BÁN (PARTNER)
============================================================ */
export const getPartnerSoldTickets = async (req, res) => {
  try {
    const partnerId = req.params.partnerId;

    const bookings = await Booking.find({
      partnerId,
      status: { $in: ["paid", "completed", "done"] }
    });

    const totalTickets = bookings.reduce((sum, b) => {
      return sum + (b.soGhe?.length || 0);
    }, 0);

    res.json({
      success: true,
      totalTickets,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi lấy vé đã bán (partner)",
      error: error.message,
    });
  }
};

/* ============================================================
   5) DASHBOARD TỔNG HỢP (PARTNER)
============================================================ */
export const getPartnerDashboard = async (req, res) => {
  const { partnerId } = req.params;

  try {
    // ví dụ query mongodb
    const bookings = await Booking.find({ partnerId, paymentStatus: "paid" });

    const totalRevenue = bookings.reduce((t, b) => t + b.totalPrice, 0);
    const totalTickets = bookings.length;

    return res.json({
      totalRevenue,
      totalTickets,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* ============================================================
   6) BÁO CÁO CHI TIẾT (PARTNER REPORT)
============================================================ */
export const getPartnerReport = async (req, res) => {
  try {
    const partnerParam = req.params?.partnerId || req.query?.partnerId || null;
    const hasPartnerFilter = Boolean(partnerParam && partnerParam !== "all");
    const filter = hasPartnerFilter ? { partnerId: partnerParam } : {};
    const rangeInfo = buildDateRange(req.query || {});
    const bookingFilter = { ...filter };
    const reviewFilter = { ...filter };

    if (rangeInfo) {
      const createdAtCondition = { $gte: rangeInfo.start, $lte: rangeInfo.end };
      bookingFilter.createdAt = createdAtCondition;
      reviewFilter.createdAt = createdAtCondition;
    }
    const appliedPeriod = rangeInfo?.mode || "all";

    // 1. Fetch bookings & hydrate trip for route info when needed
    const bookings = await Booking.find(bookingFilter).populate("tripId");
    
    // 2. Fetch trips for seat statistics
    const trips = await Trip.find(filter);

    // 3. Fetch reviews for rating
    const reviews = await Review.find(reviewFilter);

    // --- Calculations ---

    // Total Orders
    const totalOrders = bookings.length;

    // Total Revenue & Tickets
    // Filter for valid bookings for revenue (paid/completed)
    const validBookings = bookings.filter(b => ["paid", "completed", "done"].includes(b.status));
    const totalRevenue = validBookings.reduce((sum, b) => sum + (Number(b.finalTotal || b.totalPrice) || 0), 0);
    const totalTickets = validBookings.reduce((sum, b) => sum + (b.soGhe?.length || 0), 0);

    // Total Customers (Unique users)
    const uniqueCustomers = new Set(
      bookings.map((b) => b.userId || b.customerName).filter(Boolean)
    );
    const totalCustomers = uniqueCustomers.size;

    // Map userId to human-readable name from booking info
    const bookingUserNameMap = {};
    bookings.forEach((booking) => {
      if (!booking?.userId) return;
      const key = String(booking.userId);
      if (!bookingUserNameMap[key]) {
        bookingUserNameMap[key] = booking.customerName || booking.hoTen || booking.email || `Khách ${key.slice(-4)}`;
      }
    });

    // Average Rating
    const avgRating = reviews.length > 0
      ? Number((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1))
      : 0;

    // Loyalty points: sum of all if global, otherwise only customers who booked with this partner
    const buildLoyaltyLeaders = (pointsDocs = []) => {
      return pointsDocs
        .map((doc) => {
          const userKey = String(doc.userId || "unknown");
          return {
            userId: doc.userId,
            points: doc.points || 0,
            name: bookingUserNameMap[userKey] || doc.displayName || `Khách ${userKey.slice(-4)}`,
          };
        })
        .sort((a, b) => b.points - a.points)
        .slice(0, 10);
    };

    let totalPoints = 0;
    let loyaltyLeaders = [];
    if (hasPartnerFilter) {
      const relevantUserIds = [...new Set(bookings.map((b) => b.userId).filter(Boolean))];
      if (relevantUserIds.length) {
        const pointsDocs = await Point.find({ userId: { $in: relevantUserIds } });
        totalPoints = pointsDocs.reduce((sum, p) => sum + (p.points || 0), 0);
        loyaltyLeaders = buildLoyaltyLeaders(pointsDocs);
      }
    } else {
      const pointsDocs = await Point.find({});
      totalPoints = pointsDocs.reduce((sum, p) => sum + (p.points || 0), 0);
      loyaltyLeaders = buildLoyaltyLeaders(pointsDocs);
    }

    // Empty Seats
    // Empty seats = Total seats of all active trips - Booked seats
    const totalEmptySeats = trips.reduce((sum, t) => {
        const booked = t.bookedSeats ? t.bookedSeats.length : 0;
        const capacity = t.soLuongGhe || 0;
        return sum + Math.max(0, capacity - booked);
    }, 0);

    const revenueData = buildRevenueData(validBookings, rangeInfo);

    // Order Status Data
    const statusCounts = {};
    bookings.forEach(b => {
        const status = b.status || "unknown";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    const statusColorMap = {
        "paid": "#4ade80", // Green
        "completed": "#4ade80",
        "pending": "#f59e0b", // Amber
        "cancelled": "#ef4444", // Red
        "processing": "#60a5fa", // Blue
        "done": "#4ade80"
    };
    
    const orderStatusData = Object.keys(statusCounts).map((status) => ({
      name: status,
      value: statusCounts[status],
      color: statusColorMap[status] || "#94a3b8",
    }));

    // Recent Orders
    const recentOrders = bookings
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map((b) => {
        const route = b.tripId && b.tripId.tu && b.tripId.den
          ? `${b.tripId.tu} - ${b.tripId.den}`
          : b.tenChuyen || "Chuyến đi";
        return {
          id: b._id,
          customer: b.customerName || b.hoTen || "Khách lẻ",
          route,
          amount: Number(b.finalTotal || b.totalPrice) || 0,
          status: b.status,
        };
      });

    // Top Routes
    const routeMap = {};
    validBookings.forEach((b) => {
      const routeName = b.tripId && b.tripId.tu && b.tripId.den
        ? `${b.tripId.tu} - ${b.tripId.den}`
        : b.tenChuyen || "Chưa xác định";
      if (!routeMap[routeName]) {
        routeMap[routeName] = { route: routeName, tickets: 0, revenue: 0 };
      }
      routeMap[routeName].tickets += b.soGhe?.length || 0;
      routeMap[routeName].revenue += Number(b.finalTotal || b.totalPrice) || 0;
    });
    const topRoutes = Object.values(routeMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalCustomers,
        totalTickets,
        avgRating,
        totalRevenue,
        totalEmptySeats,
        totalPoints,
      },
      revenueData,
      orderStatusData,
      recentOrders,
      topRoutes,
      loyaltyLeaders,
      appliedFilter: {
        period: appliedPeriod,
        start: rangeInfo?.start || null,
        end: rangeInfo?.end || null,
      },
    });

  } catch (error) {
    console.error("Error in getPartnerReport:", error);
    res.status(500).json({ success: false, message: "Lỗi lấy báo cáo thống kê", error: error.message });
  }
};
