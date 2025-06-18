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
      'location.city': { $regex: new RegExp(location, 'i') }
    } : {};
    console.log('MongoDB query:', query);
    
    const hotels = await Hotel.find(query);
    console.log(`Found ${hotels.length} hotels matching query`);
    
    // Transform hotels to frontend format first
    const transformedHotels = hotels.map(transformHotelForFrontend)
      .filter(hotel => hotel !== null);
    
    // Count occurrences of each facility
    const facilityCounts = transformedHotels.reduce((counts, hotel) => {
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

// Helper function to transform hotel data for frontend
const transformHotelForFrontend = (hotel) => {
  if (!hotel) return null;
  
  const hotelObj = hotel.toObject ? hotel.toObject() : { ...hotel };
  
  // Format location as a string
  const locationString = hotelObj.location 
    ? `${hotelObj.location.city}, ${hotelObj.location.country}`
    : 'Unknown location';

  return {
    _id: hotelObj._id.toString(),
    name: hotelObj.name || '',
    location: locationString,
    price: hotelObj.pricePerNight || 0,
    rating: Math.min(5, Math.round((hotelObj.rating || 0) / 2)), // Convert 10-point scale to 5-point scale
    image: hotelObj.images && hotelObj.images.length > 0 ? hotelObj.images[0].url : '/images/placeholder-hotel.jpg',
    description: hotelObj.description || '',
    amenities: hotelObj.amenities || []
  };
};

// Get all hotels
router.get('/', async (req, res) => {
  try {
    const {
      location,
      checkIn,
      checkOut,
      guests,
      minPrice,
      maxPrice,
    } = req.query;

    let query = {};

    // Apply filters
    if (location) {
      query['$or'] = [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.country': new RegExp(location, 'i') }
      ];
    }

    if (minPrice || maxPrice) {
      query.pricePerNight = {};
      if (minPrice) query.pricePerNight.$gte = Number(minPrice);
      if (maxPrice) query.pricePerNight.$lte = Number(maxPrice);
    }

    if (guests) {
      query.maxGuests = { $gte: Number(guests) };
    }

    const hotels = await Hotel.find(query)
      .sort({ rating: -1 });

    const transformedHotels = hotels.map(transformHotelForFrontend)
      .filter(hotel => hotel !== null); // Remove any null results
    res.json(transformedHotels);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({ message: 'Error fetching hotels' });
  }
});

// Get featured hotels
router.get('/featured', async (req, res) => {
  try {
    const hotels = await Hotel.find()
      .sort({ rating: -1 })
      .limit(6);
    
    const transformedHotels = hotels.map(transformHotelForFrontend)
      .filter(hotel => hotel !== null); // Remove any null results
    res.json(transformedHotels);
  } catch (error) {
    console.error('Error fetching featured hotels:', error);
    res.status(500).json({ message: 'Error fetching featured hotels' });
  }
});

// Get a single hotel by ID
router.get('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    const transformedHotel = transformHotelForFrontend(hotel);
    if (!transformedHotel) {
      return res.status(404).json({ message: 'Error transforming hotel data' });
    }
    res.json(transformedHotel);
  } catch (error) {
    console.error('Error fetching hotel:', error);
    res.status(500).json({ message: 'Error fetching hotel details' });
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