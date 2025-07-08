const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');
const config = require('../config');

async function checkHotels() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.mongoURI);
        console.log('Connected to MongoDB successfully');

        // Check all hotels
        const allHotels = await Hotel.find({});
        console.log(`Found ${allHotels.length} hotels in total`);

        // Check hotels for specific owner
        const ownerId = '1ZN9NxYGozUbFAudlXoyloyfnhL2';
        const ownerHotels = await Hotel.find({ ownerId });
        console.log(`Found ${ownerHotels.length} hotels for owner ID: ${ownerId}`);

        if (ownerHotels.length > 0) {
            console.log('Owner hotels:', JSON.stringify(ownerHotels, null, 2));
        } else {
            console.log('No hotels found for this owner. Creating a sample hotel...');

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
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

checkHotels(); 