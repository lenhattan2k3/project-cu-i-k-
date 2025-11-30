import Invoice from "../models/Invoice.js";

const generateInvoiceCode = () => {
  const random = Math.floor(Math.random() * 900) + 100; // 3 digits
  return `INV-${Date.now()}-${random}`;
};

const generateCheckInCode = (bookingId) => {
  if (!bookingId) return `CHK-${Math.floor(Math.random() * 1000000)}`;
  return String(bookingId).slice(-8).toUpperCase();
};

export const ensureInvoiceForBooking = async (bookingDoc) => {
  if (!bookingDoc) return null;

  const bookingId = bookingDoc._id || bookingDoc.id;
  if (!bookingId) return null;

  const existing = await Invoice.findOne({ bookingId });
  if (existing) return existing;

  if (!bookingDoc.tripId?.tenChuyen) {
    try {
      await bookingDoc.populate("tripId");
    } catch (err) {
      console.warn("Failed to populate trip for invoice", err?.message);
    }
  }

  const trip = bookingDoc.tripId || {};
  const invoice = await Invoice.create({
    invoiceCode: generateInvoiceCode(),
    bookingId,
    userId: String(bookingDoc.userId),
    tripId: trip?._id,
    partnerId: bookingDoc.partnerId ? String(bookingDoc.partnerId) : undefined,
    amount: bookingDoc.finalTotal ?? bookingDoc.totalPrice ?? 0,
    paymentMethod: bookingDoc.paymentMethod || "unknown",
    status: "paid",
    seats: bookingDoc.soGhe || [],
    passengerName: bookingDoc.hoTen,
    passengerPhone: bookingDoc.sdt,
    checkInCode: bookingDoc.checkInCode || generateCheckInCode(bookingId),
    tripInfo: {
      name: trip?.tenChuyen,
      from: trip?.diemDi,
      to: trip?.diemDen,
      departDate: trip?.ngayKhoiHanh,
      departTime: trip?.gioKhoiHanh,
      vehicleType: trip?.loaiXe,
      partnerName: trip?.tenNhaXe,
    },
    metadata: {
      voucherCode: bookingDoc.voucherCode || null,
      discountAmount: bookingDoc.discountAmount || 0,
      foodService: bookingDoc.isFoodService || false,
    },
  });

  return invoice;
};

export const getInvoicesByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ success: false, message: "Thiếu userId" });
    }

    const invoices = await Invoice.find({ userId: String(userId) })
      .sort({ issuedAt: -1 })
      .lean();

    res.json({ success: true, invoices });
  } catch (err) {
    console.error("Failed to get invoices:", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};

export const getInvoiceDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.findById(id).lean();
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hóa đơn" });
    }
    res.json({ success: true, invoice });
  } catch (err) {
    console.error("Failed to get invoice detail:", err);
    res.status(500).json({ success: false, message: "Lỗi server", error: err.message });
  }
};
