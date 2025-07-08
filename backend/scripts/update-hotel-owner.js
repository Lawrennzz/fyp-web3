const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');
const config = require('../config');

async function updateHotelOwner() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.mongoURI);
        console.log('Connected to MongoDB successfully');

        // Owner ID to set
        const ownerId = '1ZN9NxYGozUbFAudlXoyloyfnhL2';

        // Find the sample hotel (or any hotel you want to update)
        const hotels = await Hotel.find({});
        console.log(`Found ${hotels.length} hotels in total`);

        if (hotels.length === 0) {
            console.log('No hotels found. Creating a sample hotel...');

            // Create a sample hotel for the owner
            const sampleHotel = new Hotel({
                name: 'Sample Owner Hotel',
                description: 'This is a sample hotel for testing owner functionality',
                location: {
                    city: 'Singapore',
                    country: 'Singapore',
                    address: '123 Test Street',
                    coordinates: [103.8198, 1.3521]
                },
                rating: 4.5,
                amenities: ['WiFi', 'Pool', 'Restaurant'],
                ownerId: ownerId,
                rooms: [
                    {
                        type: 'Standard',
                        pricePerNight: 100,
                        maxGuests: 2,
                        description: 'A comfortable standard room',
                        amenities: ['TV', 'Air conditioning'],
                        available: true
                    },
                    {
                        type: 'Deluxe',
                        pricePerNight: 200,
                        maxGuests: 4,
                        description: 'A spacious deluxe room',
                        amenities: ['TV', 'Air conditioning', 'Mini bar'],
                        available: true
                    }
                ]
            });

            await sampleHotel.save();
            console.log('Sample hotel created successfully:', sampleHotel);
        } else {
            // Update the first hotel
            const hotel = hotels[0];
            console.log(`Updating owner ID for hotel: ${hotel.name} (${hotel._id})`);

            hotel.ownerId = ownerId;
            await hotel.save();

            console.log('Hotel owner updated successfully:', hotel);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

updateHotelOwner(); 