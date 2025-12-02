import Invoice from "../models/Invoice.js";

const generateInvoiceCode = () => {
  const random = Math.floor(Math.random() * 900) + 100; // 3 digits
  return `INV-${Date.now()}-${random}`;
};

const generateCheckInCode = (bookingId) => {
  if (!bookingId) return `CHK-${Math.floor(Math.random() * 1000000)}`;
  return String(bookingId).slice(-8).toUpperCase();
};

const pickString = (...candidates) => {
  for (const value of candidates) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
  }
  return undefined;
};

const buildTripInfoPayload = (tripDoc = {}, bookingDoc = {}) => {
  const trip = typeof tripDoc.toObject === "function" ? tripDoc.toObject() : tripDoc;
  return {
    name: pickString(trip?.tenChuyen, bookingDoc.tenChuyen),
    from: pickString(trip?.diemDi, trip?.tu),
    to: pickString(trip?.diemDen, trip?.den),
    departDate: pickString(trip?.ngayKhoiHanh, bookingDoc.ngayKhoiHanh),
    departTime: pickString(trip?.gioKhoiHanh, bookingDoc.gioKhoiHanh),
    vehicleType: pickString(trip?.vehicleType, trip?.loaiXe),
    partnerName: pickString(trip?.tenNhaXe, trip?.nhaXe, bookingDoc.partnerName),
    pickupNote: pickString(bookingDoc.diemDonChiTiet || ""),
    image: pickString(trip?.hinhAnh),
    tripCode: pickString(bookingDoc.maTai, trip?.maTai),
    licensePlate: pickString(bookingDoc.bienSo, trip?.bienSo),
  };
};

export const ensureInvoiceForBooking = async (bookingDoc) => {
  if (!bookingDoc) return null;

  const bookingId = bookingDoc._id || bookingDoc.id;
  if (!bookingId) return null;

  const existing = await Invoice.findOne({ bookingId });
  const tripInfoPayload = buildTripInfoPayload(bookingDoc.tripId, bookingDoc);
  if (existing) {
    const shouldUpdateTripInfo = Object.entries(tripInfoPayload).some(([key, value]) => {
      if (!value) return false;
      return !existing.tripInfo?.[key];
    });

    if (shouldUpdateTripInfo) {
      existing.tripInfo = { ...(existing.tripInfo || {}), ...tripInfoPayload };
      existing.markModified("tripInfo");
      await existing.save();
    }

    return existing;
  }

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
    tripInfo: tripInfoPayload,
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
