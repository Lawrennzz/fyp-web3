const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true
  },
  description: String,
  pricePerNight: {
    type: Number,
    required: true
  },
  maxGuests: {
    type: Number,
    required: true
  },
  amenities: [String],
  images: [String],
  bookings: [{
    checkIn: Date,
    checkOut: Date,
    guests: Number,
    guestAddress: String,
    totalPrice: Number,
    transactionHash: String,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending'
    }
  }]
});

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  location: {
    city: String,
    country: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  image: String,
  images: [String],
  rating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  amenities: [String],
  rooms: [roomSchema]
});

// Create indexes for search
hotelSchema.index({ 'location.city': 1, 'location.country': 1 });
hotelSchema.index({ rating: -1 });
hotelSchema.index({ 'rooms.pricePerNight': 1 });
hotelSchema.index({ 'rooms.maxGuests': 1 });

// Method to check room availability
roomSchema.methods.isAvailableForDates = function(checkIn, checkOut) {
  if (!this.bookings || this.bookings.length === 0) return true;
  
  return !this.bookings.some(booking => {
    if (booking.status === 'cancelled') return false;
    
    const bookingStart = new Date(booking.checkIn);
    const bookingEnd = new Date(booking.checkOut);
    const requestStart = new Date(checkIn);
    const requestEnd = new Date(checkOut);
    
    return (
      (requestStart >= bookingStart && requestStart < bookingEnd) ||
      (requestEnd > bookingStart && requestEnd <= bookingEnd) ||
      (requestStart <= bookingStart && requestEnd >= bookingEnd)
    );
  });
};

module.exports = mongoose.model('Hotel', hotelSchema); 