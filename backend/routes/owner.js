const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');

// Test route
router.get('/test', (req, res) => {
    console.log('Owner test route called');
    res.json({ message: 'Owner router is working!' });
});

// Debug route to list all available owner endpoints
router.get('/', (req, res) => {
    console.log('Owner debug route called');

    // Get all registered routes in this router
    const routes = [];
    router.stack.forEach((middleware) => {
        if (middleware.route) {
            const path = middleware.route.path;
            const methods = Object.keys(middleware.route.methods)
                .filter(method => middleware.route.methods[method])
                .join(', ').toUpperCase();
            routes.push({ path, methods });
        }
    });

    res.json({
        message: 'Owner router debug info',
        routes,
        timestamp: new Date().toISOString()
    });
});

// GET /api/owner/hotels/:ownerId - Get hotels for a specific owner
router.get('/hotels/:ownerId', async (req, res) => {
    try {
        const { ownerId } = req.params;
        console.log('API: Fetching hotels for owner ID:', ownerId);

        if (!ownerId) {
            console.log('API: Owner ID is required');
            return res.status(400).json({ message: 'Owner ID is required' });
        }

        console.log('API: Searching for hotels with ownerId:', ownerId);
        const hotels = await Hotel.find({ ownerId });
        console.log(`API: Found ${hotels.length} hotels for owner ID: ${ownerId}`);

        res.json(hotels);
    } catch (error) {
        console.error('API Error fetching owner hotels:', error);
        res.status(500).json({ message: 'Error fetching owner hotels', error: error.message });
    }
});

// GET /api/owner/hotel/:id - Get a specific hotel with owner verification
router.get('/hotel/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ownerId } = req.query;

        console.log('API: Fetching hotel with ID:', id, 'for owner:', ownerId);

        if (!id || !ownerId) {
            return res.status(400).json({ message: 'Hotel ID and owner ID are required' });
        }

        const hotel = await Hotel.findById(id);

        if (!hotel) {
            console.log('Hotel not found for ID:', id);
            return res.status(404).json({ message: 'Hotel not found' });
        }

        // Verify ownership
        if (hotel.ownerId !== ownerId) {
            console.log('Ownership verification failed. Hotel owner:', hotel.ownerId, 'Requesting user:', ownerId);
            return res.status(403).json({ message: 'You do not have permission to manage this hotel' });
        }

        console.log('Ownership verified. Returning hotel data.');
        res.json(hotel);
    } catch (error) {
        console.error('API Error fetching owner hotel:', error);
        res.status(500).json({ message: 'Error fetching hotel', error: error.message });
    }
});

// POST /api/owner/create-test-hotel - Create a test hotel for the owner
router.post('/create-test-hotel', async (req, res) => {
    try {
        const { ownerId } = req.body;

        if (!ownerId) {
            return res.status(400).json({ message: 'Owner ID is required' });
        }

        console.log('Creating test hotel for owner:', ownerId);

        const testHotel = new Hotel({
            name: 'Test Owner Hotel',
            description: 'This is a test hotel for the owner dashboard',
            location: {
                city: 'Test City',
                country: 'Test Country',
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

        await testHotel.save();
        console.log('Created test hotel with ID:', testHotel._id);

        res.status(201).json({
            message: 'Test hotel created successfully',
            hotel: testHotel
        });
    } catch (error) {
        console.error('Error creating test hotel:', error);
        res.status(500).json({ message: 'Error creating test hotel', error: error.message });
    }
});

module.exports = router; 