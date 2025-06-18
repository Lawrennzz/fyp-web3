const mongoose = require('mongoose');
const Hotel = require('./models/Hotel');
const config = require('./config');

const sampleHotels = [
  {
    name: "Grand Plaza Hotel",
    description: "Luxury hotel in the heart of the city with stunning views and world-class amenities.",
    location: {
      city: "New York",
      country: "USA",
      address: "123 Broadway St, New York, NY 10013",
      coordinates: {
        lat: 40.7128,
        lng: -74.0060
      }
    },
    images: [{
      url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3",
      alt: "Grand Plaza Hotel Exterior"
    }],
    pricePerNight: 299.99,
    rating: 4.5,
    stars: 5,
    amenities: [
      'WiFi',
      'Pool',
      'Restaurant',
      'Gym',
      'Spa & Wellness',
      'Parking'
    ],
    maxGuests: 4,
    reviews: [],
    bookings: []
  },
  {
    name: "Seaside Resort & Spa",
    description: "Beautiful beachfront resort offering relaxation and luxury by the ocean.",
    location: {
      city: "Miami",
      country: "USA",
      address: "456 Ocean Drive, Miami Beach, FL 33139",
      coordinates: {
        lat: 25.7617,
        lng: -80.1918
      }
    },
    images: [{
      url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3",
      alt: "Seaside Resort Exterior"
    }],
    pricePerNight: 399.99,
    rating: 4.8,
    stars: 5,
    amenities: [
      'WiFi',
      'Pool',
      'Restaurant',
      'Spa & Wellness',
      'Parking',
      'Kids-friendly'
    ],
    maxGuests: 6,
    reviews: [],
    bookings: []
  },
  {
    name: "Mountain View Lodge",
    description: "Cozy mountain retreat perfect for outdoor enthusiasts and families.",
    location: {
      city: "Aspen",
      country: "USA",
      address: "789 Mountain Road, Aspen, CO 81611",
      coordinates: {
        lat: 39.1911,
        lng: -106.8175
      }
    },
    images: [{
      url: "https://images.unsplash.com/photo-1626268220142-f4fb8f4a8d8c?ixlib=rb-4.0.3",
      alt: "Mountain View Lodge Exterior"
    }],
    pricePerNight: 249.99,
    rating: 4.6,
    stars: 4,
    amenities: [
      'WiFi',
      'Restaurant',
      'Parking',
      'Pet-friendly',
      'Kids-friendly'
    ],
    maxGuests: 8,
    reviews: [],
    bookings: []
  },
  {
    name: "City Lights Hotel",
    description: "Modern urban hotel with excellent business facilities and city views.",
    location: {
      city: "Chicago",
      country: "USA",
      address: "321 Michigan Ave, Chicago, IL 60601",
      coordinates: {
        lat: 41.8781,
        lng: -87.6298
      }
    },
    images: [{
      url: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?ixlib=rb-4.0.3",
      alt: "City Lights Hotel Exterior"
    }],
    pricePerNight: 199.99,
    rating: 4.3,
    stars: 4,
    amenities: [
      'WiFi',
      'Restaurant',
      'Gym',
      'Parking',
      'Business Center'
    ],
    maxGuests: 3,
    reviews: [],
    bookings: []
  },
  {
    name: "Desert Oasis Resort",
    description: "Luxurious desert retreat with stunning views and world-class spa facilities.",
    location: {
      city: "Phoenix",
      country: "USA",
      address: "555 Desert Road, Phoenix, AZ 85001",
      coordinates: {
        lat: 33.4484,
        lng: -112.0740
      }
    },
    images: [{
      url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3",
      alt: "Desert Oasis Resort Exterior"
    }],
    pricePerNight: 349.99,
    rating: 4.7,
    stars: 5,
    amenities: [
      'WiFi',
      'Pool',
      'Spa & Wellness',
      'Restaurant',
      'Parking',
      'Kids-friendly'
    ],
    maxGuests: 5,
    reviews: [],
    bookings: []
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await Hotel.deleteMany({});
    console.log('Cleared existing hotels');
    
    // Insert sample hotels
    const hotels = await Hotel.insertMany(sampleHotels);
    
    console.log(`Successfully seeded ${hotels.length} hotels`);
    return hotels;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

module.exports = {
  seedDatabase,
  sampleHotels
};

// Execute seeding if this file is run directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Database seeding completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Database seeding failed:', error);
      process.exit(1);
    });
} 