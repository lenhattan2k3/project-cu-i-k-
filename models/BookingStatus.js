import mongoose from 'mongoose';

const bookingStatusSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'bank', 'cash', null],
    default: null
  },
  reason: { // dùng khi cancelled hoặc refunded
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const BookingStatus = mongoose.model('BookingStatus', bookingStatusSchema);

export default BookingStatus;
