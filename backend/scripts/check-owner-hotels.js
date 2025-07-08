const mongoose = require('mongoose');
const Hotel = require('../models/Hotel');
const config = require('../config');

const ownerId = '1ZN9NxYGozUbFAudlXoyloyfnhL2';

mongoose.connect(config.mongoURI)
    .then(async () => {
        console.log('Connected to MongoDB');

        try {
            const hotels = await Hotel.find({ ownerId });
            console.log(`Found ${hotels.length} hotels for owner ${ownerId}`);

            if (hotels.length === 0) {
                console.log('Creating a sample hotel for this owner...');

                const newHotel = new Hotel({
                    name: 'Sample Owner Hotel',
                    description: 'This is a sample hotel for testing the owner dashboard',
                    location: {
                        city: 'Sample City',
                        country: 'Sample Country',
                        address: '123 Test Street'
                    },
                    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
                    images: [
                        { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945', alt: 'Hotel Front' }
                    ],
                    rating: 4.5,
                    amenities: ['WiFi', 'Pool', 'Parking', 'Restaurant'],
                    rooms: [
                        {
                            type: 'Deluxe Room',
                            pricePerNight: 150,
                            maxGuests: 2,
                            description: 'A comfortable room with all amenities',
                            amenities: ['TV', 'Air Conditioning', 'Mini Bar'],
                            images: [
                                { url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a', alt: 'Deluxe Room' }
                            ]
                        }
                    ],
                    ownerId: ownerId
                });

                await newHotel.save();
                console.log(`Created new hotel with ID: ${newHotel._id}`);
            } else {
                hotels.forEach(hotel => {
                    console.log(`- ${hotel._id}: ${hotel.name}`);
                });
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            mongoose.disconnect();
            console.log('Disconnected from MongoDB');
        }
    })
    .catch(err => {
        console.error('Connection error:', err);
    }); 