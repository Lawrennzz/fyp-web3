const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');

// Get facility counts - MUST be before /:id route to avoid conflict
router.get('/facilities/count', async (req, res) => {
  try {
    const { location } = req.query;
    console.log('Fetching facility counts for location:', location);
    
    const query = location ? {
      $or: [
        { city: { $regex: new RegExp(location, 'i') } },
        { 'location.city': { $regex: new RegExp(location, 'i') } }
      ]
    } : {};
    console.log('MongoDB query:', query);
    
    const hotels = await Hotel.find(query);
    console.log(`Found ${hotels.length} hotels matching query`);
    
    // Count occurrences of each facility
    const facilityCounts = hotels.reduce((counts, hotel) => {
      if (Array.isArray(hotel.amenities)) {
        hotel.amenities.forEach(facility => {
          counts[facility] = (counts[facility] || 0) + 1;
        });
      }
      return counts;
    }, {});

    console.log('Facility counts:', facilityCounts);
    res.json(facilityCounts);
  } catch (error) {
    console.error('Error getting facility counts:', error);
    res.status(500).json({ message: 'Error getting facility counts', error: error.message });
  }
});

// Helper function to transform hotel data
const transformHotelData = (hotel) => {
  if (!hotel) return null;

  // Convert Mongoose document to plain object if needed
  const hotelObj = hotel.toObject ? hotel.toObject() : { ...hotel };
  
  // Ensure ID is available in both formats
  if (hotelObj._id) {
    hotelObj.id = hotelObj._id.toString();
  }
  
  // Handle location data properly
  if (hotelObj.location) {
    hotelObj.city = hotelObj.city || hotelObj.location.city;
    hotelObj.country = hotelObj.country || hotelObj.location.country;
    
    // Ensure coordinates are properly structured
    if (hotelObj.location.coordinates) {
      hotelObj.location = {
        coordinates: {
          lat: hotelObj.location.coordinates.lat || 0,
          lng: hotelObj.location.coordinates.lng || 0
        },
        description: hotelObj.location.description || `Located in ${hotelObj.city || 'undefined'}, ${hotelObj.country || 'undefined'}`
      };
    } else {
      hotelObj.location = {
        coordinates: { lat: 0, lng: 0 },
        description: `Located in ${hotelObj.city || 'undefined'}, ${hotelObj.country || 'undefined'}`
      };
    }
  }

  // Ensure rooms array exists and is properly formatted
  if (!Array.isArray(hotelObj.rooms)) {
    hotelObj.rooms = [];
  }

  // Transform each room to ensure proper format
  hotelObj.rooms = hotelObj.rooms.map(room => {
    if (!room) return null;
    return {
      id: room._id ? room._id.toString() : null,
      type: room.type || 'Standard',
      beds: {
        count: room.beds?.count || 1,
        type: room.beds?.type || 'Single'
      },
      price: room.price || 0,
      available: room.available !== false // default to true if not specified
    };
  }).filter(room => room !== null);  // Remove any null rooms

  // Filter out unavailable rooms
  hotelObj.rooms = hotelObj.rooms.filter(room => room.available);

  // Sort rooms by price
  hotelObj.rooms.sort((a, b) => a.price - b.price);

  // Ensure images array exists and is properly formatted
  if (!Array.isArray(hotelObj.images)) {
    hotelObj.images = [];
  }

  // Transform images to ensure proper format
  hotelObj.images = hotelObj.images.map(image => {
    if (!image) return null;
    return {
      url: image.url || '',
      alt: image.alt || hotelObj.name || 'Hotel Image'
    };
  }).filter(image => image !== null && image.url);  // Remove any null images or images without URLs

  // Ensure other required fields have default values
  hotelObj.name = hotelObj.name || 'Unnamed Hotel';
  hotelObj.description = hotelObj.description || '';
  hotelObj.rating = hotelObj.rating || 0;
  hotelObj.reviews = hotelObj.reviews || 0;
  hotelObj.price = hotelObj.price || 0;
  hotelObj.address = hotelObj.address || '';
  hotelObj.amenities = Array.isArray(hotelObj.amenities) ? hotelObj.amenities : [];
  hotelObj.starRating = hotelObj.starRating || 0;

  return hotelObj;
};

// Get featured hotels
router.get('/featured', async (req, res) => {
  try {
    const featuredHotels = await Hotel.find()
      .sort('-rating')
      .limit(6);
    
    res.json(featuredHotels);
  } catch (error) {
    console.error('Error fetching featured hotels:', error);
    res.status(500).json({ message: 'Error fetching featured hotels', error: error.message });
  }
});

// GET /api/hotels - Get all hotels with optional filters
router.get('/', async (req, res) => {
  try {
    console.log('Received hotel search request with params:', req.query);

    const {
      city,
      checkIn,
      checkOut,
      guests,
      rating,
      stars,
      amenities,
      minPrice,
      maxPrice,
      sort = 'most_relevant'
    } = req.query;

    // Build query object
    const query = {};

    // Location filter (case-insensitive partial match)
    if (city) {
      query.$or = [
        { 'location.city': { $regex: city, $options: 'i' } },
        { 'location.country': { $regex: city, $options: 'i' } }
      ];
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.pricePerNight = {};
      if (minPrice !== undefined) query.pricePerNight.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.pricePerNight.$lte = Number(maxPrice);
    }

    // Rating filter
    if (rating) {
      const ratings = rating.split(',').map(Number);
      if (ratings.length) {
        query.rating = { $in: ratings };
      }
    }

    // Star rating filter
    if (stars) {
      const starValues = stars.split(',').map(Number);
      if (starValues.length) {
        query.stars = { $in: starValues };
      }
    }

    // Amenities filter
    if (amenities) {
      const amenityList = amenities.split(',');
      if (amenityList.length) {
        query.amenities = { $all: amenityList };
      }
    }

    // Guest capacity filter
    if (guests) {
      query.maxGuests = { $gte: Number(guests) };
    }

    console.log('Final MongoDB query:', JSON.stringify(query, null, 2));

    // Execute query with sorting
    let hotelsQuery = Hotel.find(query);

    // Apply sorting
    switch (sort) {
      case 'price_low':
        hotelsQuery = hotelsQuery.sort({ pricePerNight: 1 });
        break;
      case 'price_high':
        hotelsQuery = hotelsQuery.sort({ pricePerNight: -1 });
        break;
      case 'rating':
        hotelsQuery = hotelsQuery.sort({ rating: -1 });
        break;
      case 'stars':
        hotelsQuery = hotelsQuery.sort({ stars: -1 });
        break;
      default:
        // most_relevant - sort by a combination of rating and stars
        hotelsQuery = hotelsQuery.sort({ rating: -1, stars: -1 });
    }

    const hotels = await hotelsQuery.exec();
    console.log(`Found ${hotels.length} hotels matching criteria`);
    
    res.json(hotels);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({ message: 'Error fetching hotels', error: error.message });
  }
});

// GET /api/hotels/:id - Get a specific hotel by ID
router.get('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found' });
    }
    res.json(hotel);
  } catch (error) {
    console.error('Error fetching hotel by ID:', error);
    res.status(500).json({ 
      error: 'Failed to fetch hotel',
      details: error.message 
    });
  }
});

module.exports = router; 