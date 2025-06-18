const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');

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

// Validate amenities helper function
const validateAmenities = (amenities) => {
  if (!Array.isArray(amenities)) return false;
  return amenities.every(amenity => standardAmenities.includes(amenity));
};

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
    const hotels = await Hotel.find()
      .sort({ rating: -1 })
      .limit(6);
    res.json(hotels);
  } catch (error) {
    console.error('Error fetching featured hotels:', error);
    res.status(500).json({ message: 'Error fetching featured hotels' });
  }
});

// Get all hotels with filters
router.get('/', async (req, res) => {
  try {
    const {
      location,
      checkIn,
      checkOut,
      guests,
      minPrice,
      maxPrice,
      amenities,
      stars,
      sort
    } = req.query;

    let query = {};

    // Apply filters
    if (location) {
      query['location.city'] = new RegExp(location, 'i');
    }

    if (minPrice || maxPrice) {
      query.pricePerNight = {};
      if (minPrice) query.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) query.pricePerNight.$lte = Number(maxPrice);
    }

    if (guests) {
      query.maxGuests = { $gte: Number(guests) };
    }

    if (amenities) {
      const amenitiesList = amenities.split(',');
      if (validateAmenities(amenitiesList)) {
        query.amenities = { $all: amenitiesList };
      }
    }

    if (stars) {
      query.stars = Number(stars);
    }

    // Apply sorting
    let sortQuery = {};
    switch (sort) {
      case 'price_low':
        sortQuery = { pricePerNight: 1 };
        break;
      case 'price_high':
        sortQuery = { pricePerNight: -1 };
        break;
      case 'rating':
        sortQuery = { rating: -1 };
        break;
      case 'stars':
        sortQuery = { stars: -1 };
        break;
      default:
        sortQuery = { rating: -1 }; // Default sort by rating
    }

    const hotels = await Hotel.find(query).sort(sortQuery);
    res.json(hotels);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({ message: 'Error fetching hotels' });
  }
});

// Get hotel by ID
router.get('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    res.json(hotel);
  } catch (error) {
    console.error('Error fetching hotel:', error);
    res.status(500).json({ message: 'Error fetching hotel' });
  }
});

// Create new hotel
router.post('/', async (req, res) => {
  try {
    const hotelData = req.body;
    
    // Validate amenities
    if (!validateAmenities(hotelData.amenities)) {
      return res.status(400).json({ 
        message: 'Invalid amenities. Must be from the standard list.',
        validAmenities: standardAmenities
      });
    }

    const hotel = new Hotel(hotelData);
    await hotel.save();
    res.status(201).json(hotel);
  } catch (error) {
    console.error('Error creating hotel:', error);
    res.status(500).json({ message: 'Error creating hotel' });
  }
});

// Update hotel
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    
    // Validate amenities if they're being updated
    if (updates.amenities && !validateAmenities(updates.amenities)) {
      return res.status(400).json({ 
        message: 'Invalid amenities. Must be from the standard list.',
        validAmenities: standardAmenities
      });
    }

    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    
    res.json(hotel);
  } catch (error) {
    console.error('Error updating hotel:', error);
    res.status(500).json({ message: 'Error updating hotel' });
  }
});

// Delete hotel
router.delete('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    res.json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    console.error('Error deleting hotel:', error);
    res.status(500).json({ message: 'Error deleting hotel' });
  }
});

module.exports = router; 