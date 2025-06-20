const mongoose = require('mongoose');
const Hotel = require('./models/Hotel');
const config = require('./config');

const seedDatabase = async () => {
  try {
    await mongoose.connect(config.mongoURI);
    console.log('Connected to MongoDB for seeding');

    // Clear existing data
    await Hotel.deleteMany({});
    console.log('Cleared existing hotels');

    const hotels = [
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
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80"
        ],
        rating: 9.5,
        amenities: ["WiFi", "Pool", "Spa & Wellness", "Restaurant", "Bar", "Parking"],
        rooms: [
          {
            type: "Deluxe Room",
            description: "Spacious room with city views",
            pricePerNight: 500,
            maxGuests: 2,
            amenities: ["WiFi", "Room Service", "Mini Bar", "Smart TV"],
            images: [
              "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
              "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"
            ]
          },
          {
            type: "Executive Suite",
            description: "Luxury suite with separate living area",
            pricePerNight: 750,
            maxGuests: 2,
            amenities: ["WiFi", "Room Service", "Mini Bar", "Smart TV", "Lounge Access"],
            images: [
              "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
              "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
            ]
          }
        ]
      },
      {
        name: "Mandarin Oriental",
        description: "Contemporary luxury hotel with exceptional service",
        location: {
          city: "London",
          country: "United Kingdom",
          address: "66 Knightsbridge",
          coordinates: {
            lat: 51.5027,
            lng: -0.1608
          }
        },
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80"
        ],
        rating: 9.3,
        amenities: ["WiFi", "Pool", "Spa & Wellness", "Restaurant", "Bar", "Gym"],
        rooms: [
          {
            type: "Deluxe Room",
            description: "Elegant room with city views",
            pricePerNight: 600,
            maxGuests: 2,
            amenities: ["WiFi", "Room Service", "Mini Bar", "Smart TV"],
            images: [
              "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
              "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"
            ]
          },
          {
            type: "Premier Suite",
            description: "Spacious suite with panoramic views",
            pricePerNight: 900,
            maxGuests: 3,
            amenities: ["WiFi", "Room Service", "Mini Bar", "Smart TV", "Lounge Access", "Butler Service"],
            images: [
              "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
              "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
            ]
          }
        ]
      },
      {
        name: "Le Royal Monceau",
        description: "Luxury Parisian hotel with artistic flair",
        location: {
          city: "Paris",
          country: "France",
          address: "37 Avenue Hoche",
          coordinates: {
            lat: 48.8747,
            lng: 2.3008
          }
        },
        image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
        images: [
          "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80"
        ],
        rating: 9.4,
        amenities: ["WiFi", "Pool", "Spa & Wellness", "Restaurant", "Bar", "Art Gallery"],
        rooms: [
          {
            type: "Studio Room",
            description: "Contemporary room with artistic touches",
            pricePerNight: 550,
            maxGuests: 2,
            amenities: ["WiFi", "Room Service", "Mini Bar", "Smart TV", "Art Books"],
            images: [
              "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80",
              "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"
            ]
          },
          {
            type: "Signature Suite",
            description: "Luxurious suite with Parisian elegance",
            pricePerNight: 850,
            maxGuests: 3,
            amenities: ["WiFi", "Room Service", "Mini Bar", "Smart TV", "Private Terrace"],
            images: [
              "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
              "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80"
            ]
          }
        ]
      }
    ];

    await Hotel.insertMany(hotels);
    console.log('Successfully seeded 3 hotels');

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 