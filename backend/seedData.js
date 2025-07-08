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

    // Owner ID to use for all hotels
    const ownerId = "1ZN9NxYGozUbFAudlXoyloyfnhL2";

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
          { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", alt: "Hotel Front" },
          { url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80", alt: "Hotel Lobby" },
          { url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80", alt: "Hotel Pool" }
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
              { url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80", alt: "Deluxe Room" },
              { url: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80", alt: "Deluxe Bathroom" }
            ]
          },
          {
            type: "Executive Suite",
            description: "Luxury suite with separate living area",
            pricePerNight: 750,
            maxGuests: 2,
            amenities: ["WiFi", "Room Service", "Mini Bar", "Smart TV", "Lounge Access"],
            images: [
              { url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80", alt: "Executive Suite" },
              { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80", alt: "Suite Living Area" }
            ]
          }
        ],
        ownerId: ownerId
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
          { url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80", alt: "Hotel Exterior" },
          { url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80", alt: "Hotel Interior" }
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
              { url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80", alt: "Deluxe Room" },
              { url: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80", alt: "Deluxe Bathroom" }
            ]
          },
          {
            type: "Premier Suite",
            description: "Spacious suite with panoramic views",
            pricePerNight: 900,
            maxGuests: 3,
            amenities: ["WiFi", "Room Service", "Mini Bar", "Smart TV", "Lounge Access", "Butler Service"],
            images: [
              { url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80", alt: "Premier Suite" },
              { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80", alt: "Suite Living Area" }
            ]
          }
        ],
        ownerId: ownerId
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
          { url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=80", alt: "Hotel Exterior" },
          { url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80", alt: "Hotel Interior" }
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
              { url: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80", alt: "Studio Room" },
              { url: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80", alt: "Studio Bathroom" }
            ]
          },
          {
            type: "Signature Suite",
            description: "Luxurious suite with Parisian elegance",
            pricePerNight: 850,
            maxGuests: 3,
            amenities: ["WiFi", "Room Service", "Mini Bar", "Smart TV", "Private Terrace"],
            images: [
              { url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80", alt: "Signature Suite" },
              { url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80", alt: "Suite Living Area" }
            ]
          }
        ],
        ownerId: ownerId
      },
      {
        name: "Sample Owner Hotel",
        description: "This is a sample hotel for testing owner functionality",
        location: {
          city: "Singapore",
          country: "Singapore",
          address: "123 Test Street"
        },
        image: "https://placehold.co/800x600/e0e0e0/808080?text=Sample+Owner+Hotel",
        images: [
          { url: "https://placehold.co/800x600/e0e0e0/808080?text=Sample+Owner+Hotel", alt: "Hotel Front" }
        ],
        rating: 4.5,
        amenities: ["WiFi", "Pool", "Restaurant"],
        rooms: [
          {
            type: "Standard",
            description: "A comfortable standard room",
            pricePerNight: 100,
            maxGuests: 2,
            amenities: ["TV", "Air conditioning"],
            images: [
              { url: "https://placehold.co/800x600/e0e0e0/808080?text=Standard+Room", alt: "Standard Room" }
            ]
          },
          {
            type: "Deluxe",
            description: "A spacious deluxe room",
            pricePerNight: 200,
            maxGuests: 4,
            amenities: ["TV", "Air conditioning", "Mini bar"],
            images: [
              { url: "https://placehold.co/800x600/e0e0e0/808080?text=Deluxe+Room", alt: "Deluxe Room" }
            ]
          }
        ],
        ownerId: ownerId
      }
    ];

    await Hotel.insertMany(hotels);
    console.log(`Successfully seeded ${hotels.length} hotels`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 