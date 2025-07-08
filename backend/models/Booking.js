const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    hotelId: { type: String, required: true },
    roomId: { type: String, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    guests: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    status: { type: String, enum: ['active', 'cancelled', 'completed'], default: 'active' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    hotelName: { type: String },
    roomType: { type: String },
    guestInfo: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String
    },
    transactionHash: { type: String },
    approvalHash: { type: String },
    editRequested: { type: Boolean, default: false },
    refunded: { type: Boolean, default: false }
});

module.exports = mongoose.model('Booking', BookingSchema); 