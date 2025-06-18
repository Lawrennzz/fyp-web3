const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  type: { type: String, required: true },
  beds: {
    count: { type: Number, required: true, min: 1 },
    type: { type: String, required: true }
  },
  price: { type: Number, required: true, min: 0 },
  available: { type: Boolean, default: true }
});

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    city: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: String
  }],
  pricePerNight: {
    type: Number,
    required: true,
    min: 0
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 1
  },
  stars: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  amenities: [{
    type: String,
    required: true
  }],
  maxGuests: {
    type: Number,
    required: true,
    min: 1
  },
  reviews: [{
    user: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  bookings: [{
    checkIn: Date,
    checkOut: Date,
    guests: Number,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending'
    }
  }]
}, {
  timestamps: true
});

// Add indexes for common queries
hotelSchema.index({ 'location.city': 1, 'location.country': 1 });
hotelSchema.index({ pricePerNight: 1 });
hotelSchema.index({ rating: -1 });
hotelSchema.index({ stars: -1 });
hotelSchema.index({ amenities: 1 });
hotelSchema.index({ maxGuests: 1 });

module.exports = mongoose.model('Hotel', hotelSchema); 