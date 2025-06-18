const mongoose = require('mongoose');
const Hotel = require('./models/Hotel');
const config = require('./config');

// Standardized amenities list
const standardAmenities = [
  'WiFi',
  'Pool',
  'Restaurant',
  'Gym',
  'Spa & Wellness',
  'Parking',
  'Kids-friendly',
  'Room Service',
  'Pet-friendly',
  'Bar'
];

const sampleHotels = [
  {
    name: "The Ritz-Carlton",
    description: "Luxury hotel with stunning views and world-class service",
    location: {
      city: "London",
      country: "United Kingdom",
      address: "150 Piccadilly, St. James's",
      coordinates: {
        lat: 51.5074,
        lng: -0.1278
      }
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
        alt: "Ritz-Carlton Exterior"
      }
    ],
    pricePerNight: 500,
    rating: 9.5,
    stars: 5,
    amenities: ["WiFi", "Pool", "Spa & Wellness", "Restaurant", "Bar"],
    maxGuests: 4
  },
  {
    name: "Four Seasons Hotel",
    description: "Contemporary luxury in the heart of Dublin",
    location: {
      city: "Dublin",
      country: "Ireland",
      address: "Simmonscourt Road",
      coordinates: {
        lat: 53.3498,
        lng: -6.2603
      }
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
        alt: "Four Seasons Exterior"
      }
    ],
    pricePerNight: 450,
    rating: 9.2,
    stars: 5,
    amenities: ["WiFi", "Pool", "Gym", "Restaurant"],
    maxGuests: 3
  },
  {
    name: "Shangri-La Bosphorus",
    description: "Elegant luxury hotel with Bosphorus views",
    location: {
      city: "Istanbul",
      country: "Turkey",
      address: "Sinanpaşa Mah",
      coordinates: {
        lat: 41.0082,
        lng: 28.9784
      }
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa",
        alt: "Shangri-La Exterior"
      }
    ],
    pricePerNight: 400,
    rating: 9.0,
    stars: 5,
    amenities: ["WiFi", "Pool", "Spa & Wellness", "Restaurant"],
    maxGuests: 4
  },
  {
    name: "Le Royal Monceau",
    description: "Artistic luxury hotel near the Champs-Élysées",
    location: {
      city: "Paris",
      country: "France",
      address: "37 Avenue Hoche",
      coordinates: {
        lat: 48.8566,
        lng: 2.3522
      }
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1564501049412-61c2a3083791",
        alt: "Le Royal Monceau Exterior"
      }
    ],
    pricePerNight: 600,
    rating: 9.3,
    stars: 5,
    amenities: ["WiFi", "Pool", "Spa & Wellness", "Restaurant", "Bar"],
    maxGuests: 3
  },
  {
    name: "Mandarin Oriental",
    description: "Contemporary luxury with Asian influences",
    location: {
      city: "London",
      country: "United Kingdom",
      address: "66 Knightsbridge",
      coordinates: {
        lat: 51.5074,
        lng: -0.1278
      }
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1561501900-3701fa6a0864",
        alt: "Mandarin Oriental Exterior"
      }
    ],
    pricePerNight: 550,
    rating: 9.4,
    stars: 5,
    amenities: ["WiFi", "Pool", "Spa & Wellness", "Restaurant"],
    maxGuests: 4
  },
  {
    name: "The Merrion Hotel",
    description: "Classic luxury in Georgian Dublin",
    location: {
      city: "Dublin",
      country: "Ireland",
      address: "Upper Merrion Street",
      coordinates: {
        lat: 53.3498,
        lng: -6.2603
      }
    },
    images: [
      {
        url: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
        alt: "Merrion Hotel Exterior"
      }
    ],
    pricePerNight: 400,
    rating: 9.1,
    stars: 5,
    amenities: ["WiFi", "Pool", "Spa & Wellness", "Restaurant", "Bar"],
    maxGuests: 3
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
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase(); 