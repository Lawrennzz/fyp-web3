const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');
const InvoiceGenerator = require('../utils/invoiceGenerator');
const path = require('path');

// Add a constant for the placeholder hotel image at the top of the file
const PLACEHOLDER_HOTEL_IMAGE = "https://placehold.co/800x600/e0e0e0/808080?text=Hotel+Placeholder";

/**
 * Normalize image URL to ensure it's valid
 * @param {string} imageUrl - The image URL to normalize
 * @returns {string} - Normalized image URL
 */
const normalizeImageUrl = (imageUrl) => {
  console.log('normalizeImageUrl input:', imageUrl);

  if (!imageUrl) {
    console.log('Empty URL, returning placeholder:', PLACEHOLDER_HOTEL_IMAGE);
    return PLACEHOLDER_HOTEL_IMAGE;
  }

  // If it's already a full URL (http/https) or data URL, return as is
  if (imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://') ||
    imageUrl.startsWith('data:image/')) {
    console.log('Full URL detected, returning as is');
    return imageUrl;
  }

  // If it's an IPFS URL without protocol, add it
  if (imageUrl.startsWith('ipfs://')) {
    // Convert IPFS URL to gateway URL
    const converted = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
    console.log('IPFS URL converted to:', converted);
    return converted;
  }

  // If it's a relative path, ensure it starts with /
  if (!imageUrl.startsWith('/')) {
    const prefixed = `/${imageUrl}`;
    console.log('Adding / prefix to relative path:', prefixed);
    return prefixed;
  }

  console.log('URL unchanged:', imageUrl);
  return imageUrl;
};

// TEST ROUTE - Remove after debugging
router.get('/test', (req, res) => {
  console.log('TEST ROUTE CALLED');
  res.json({ message: 'Hotels router is working!' });
});

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

// Standardized room amenities list
const roomAmenities = [
  'TV',
  'Air Conditioning',
  'Mini Bar',
  'Free WiFi',
  'Safe',
  'Desk',
  'Balcony',
  'Sea View',
  'City View',
  'Bathtub',
  'Shower',
  'Coffee Machine',
  'King Size Bed',
  'Queen Size Bed',
  'Twin Beds'
];

// Validate amenities helper function
const validateAmenities = (amenities) => {
  if (!Array.isArray(amenities)) return false;
  return amenities.every(amenity => standardAmenities.includes(amenity));
};

// Validate room amenities helper function
const validateRoomAmenities = (amenities) => {
  if (!Array.isArray(amenities)) return false;
  return amenities.every(amenity => roomAmenities.includes(amenity));
};

// Helper function to transform hotel data for frontend
const transformHotelForFrontend = (hotel) => {
  if (!hotel) return null;

  const hotelObj = hotel.toObject ? hotel.toObject() : hotel;

  // Transform images to standard format
  const transformedImages = (hotelObj.images || []).map(image => {
    if (typeof image === 'string') {
      return { url: normalizeImageUrl(image), alt: `${hotelObj.name} view` };
    }
    return {
      url: normalizeImageUrl(image.url),
      alt: image.alt || `${hotelObj.name} view`
    };
  });

  return {
    _id: hotelObj._id.toString(),
    name: hotelObj.name,
    location: {
      city: hotelObj.location?.city || '',
      country: hotelObj.location?.country || '',
      address: hotelObj.location?.address || '',
      coordinates: hotelObj.location?.coordinates || null
    },
    rating: Math.min(5, Math.round((hotelObj.rating || 0) / 2)), // Convert 10-point scale to 5-point scale
    image: transformedImages.length > 0 ? transformedImages[0].url : PLACEHOLDER_HOTEL_IMAGE,
    images: transformedImages,
    description: hotelObj.description || '',
    amenities: hotelObj.amenities || [],
    ownerId: hotelObj.ownerId || null,
    blockchainId: hotelObj.blockchainId || null,
    rooms: (hotelObj.rooms || []).map(room => ({
      _id: room._id.toString(),
      type: room.type,
      description: room.description,
      beds: room.beds,
      pricePerNight: room.pricePerNight,
      available: room.available,
      amenities: room.amenities || [],
      maxGuests: room.maxGuests,
      images: (room.images || []).map(image => {
        if (typeof image === 'string') {
          return { url: image, alt: `${room.type} view` };
        }
        return image;
      })
    }))
  };
};

// ===== ROUTE DEFINITIONS =====
// IMPORTANT: Order matters! More specific routes must come first

// GET /api/hotels/owner/:ownerId - Get hotels for a specific owner
// Using explicit path to avoid conflicts with /:id route
router.get('/owner/:ownerId([a-zA-Z0-9]{20,})', async (req, res) => {
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

    const transformedHotels = hotels.map(transformHotelForFrontend)
      .filter(hotel => hotel !== null);
    console.log('API: Transformed hotels:', transformedHotels.length);

    res.json(transformedHotels);
  } catch (error) {
    console.error('API Error fetching owner hotels:', error);
    res.status(500).json({ message: 'Error fetching owner hotels', error: error.message });
  }
});

// Get facility counts
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

// GET /api/hotels - Get all hotels with optional filters
router.get('/', async (req, res) => {
  try {
    const { location, checkIn, checkOut, guests, minPrice, maxPrice, amenities, rating, ownerId } = req.query;

    let query = {};

    // Owner filter
    if (ownerId) {
      console.log('Filtering hotels by owner ID:', ownerId);
      query.ownerId = ownerId;
    }

    // Location filter (case-insensitive partial match)
    if (location) {
      query.$or = [
        { 'location.city': { $regex: location, $options: 'i' } },
        { 'location.country': { $regex: location, $options: 'i' } }
      ];
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query['rooms.pricePerNight'] = {};
      if (minPrice) query['rooms.pricePerNight'].$gte = Number(minPrice);
      if (maxPrice) query['rooms.pricePerNight'].$lte = Number(maxPrice);
    }

    // Guest capacity filter
    if (guests) {
      query['rooms.maxGuests'] = { $gte: Number(guests) };
    }

    // Amenities filter
    if (amenities) {
      const amenitiesList = amenities.split(',');
      query.amenities = { $all: amenitiesList };
    }

    // Rating filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    console.log('MongoDB query:', JSON.stringify(query));
    const hotels = await Hotel.find(query)
      .select('name description location image images rating amenities rooms ownerId blockchainId')
      .sort({ rating: -1 });
    console.log(`Found ${hotels.length} hotels matching query`);

    // If dates are provided, filter available rooms
    if (checkIn && checkOut) {
      const filteredHotels = hotels.map(hotel => {
        const availableRooms = hotel.rooms.filter(room =>
          room.isAvailableForDates(checkIn, checkOut)
        );
        return {
          ...hotel.toObject(),
          rooms: availableRooms
        };
      }).filter(hotel => hotel.rooms.length > 0);

      res.json(filteredHotels);
    } else {
      // Transform hotels for frontend
      const transformedHotels = hotels.map(transformHotelForFrontend)
        .filter(hotel => hotel !== null);
      res.json(transformedHotels);
    }
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({ message: 'Error fetching hotels', error: error.message });
  }
});

// GET /api/hotels/:id - Get a specific hotel
// Using regex to match MongoDB ObjectId format (24 hex characters)
router.get('/:id([0-9a-fA-F]{24})', async (req, res) => {
  try {
    console.log('Fetching hotel with ID:', req.params.id);
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      console.log('Hotel not found for ID:', req.params.id);
      return res.status(404).json({ message: 'Hotel not found' });
    }

    console.log('Hotel found, transforming for frontend...');
    const transformedHotel = transformHotelForFrontend(hotel);

    if (!transformedHotel) {
      console.log('Failed to transform hotel data');
      return res.status(500).json({ message: 'Error processing hotel data' });
    }

    console.log('Successfully returning transformed hotel data');
    res.json(transformedHotel);
  } catch (error) {
    console.error('Error fetching hotel:', error);
    res.status(500).json({ message: 'Error fetching hotel', error: error.message });
  }
});

// POST /api/hotels - Create new hotel
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      images,
      rating,
      amenities,
      rooms,
      ownerId,
      blockchainId
    } = req.body;

    // Basic validation
    if (!name || !location || !location.city || !location.country) {
      return res.status(400).json({ message: 'Name and location are required' });
    }

    // Validate amenities if provided
    if (amenities && !validateAmenities(amenities)) {
      return res.status(400).json({
        message: 'Invalid amenities provided',
        validAmenities: standardAmenities
      });
    }

    const hotel = new Hotel({
      name,
      description,
      location,
      images: images || [],
      rating: rating || 0,
      amenities: amenities || [],
      rooms: rooms || [],
      ownerId,
      blockchainId
    });

    await hotel.save();
    res.status(201).json(hotel);
  } catch (error) {
    console.error('Error creating hotel:', error);
    res.status(500).json({ message: 'Error creating hotel', error: error.message });
  }
});

// PUT /api/hotels/:id - Update a hotel
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      images,
      rating,
      amenities,
      rooms,
      ownerId,
      blockchainId
    } = req.body;

    // Validate amenities if provided
    if (amenities && !validateAmenities(amenities)) {
      return res.status(400).json({
        message: 'Invalid amenities provided',
        validAmenities: standardAmenities
      });
    }

    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Update fields if provided
    if (name) hotel.name = name;
    if (description) hotel.description = description;
    if (location) hotel.location = location;
    if (images) hotel.images = images;
    if (rating !== undefined) hotel.rating = rating;
    if (amenities) hotel.amenities = amenities;
    if (rooms) hotel.rooms = rooms;
    if (ownerId) hotel.ownerId = ownerId;
    if (blockchainId) hotel.blockchainId = blockchainId;

    await hotel.save();
    res.json(hotel);
  } catch (error) {
    console.error('Error updating hotel:', error);
    res.status(500).json({ message: 'Error updating hotel', error: error.message });
  }
});

// DELETE /api/hotels/:id - Delete a hotel
router.delete('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }
    res.json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    console.error('Error deleting hotel:', error);
    res.status(500).json({ message: 'Error deleting hotel', error: error.message });
  }
});

// GET /api/hotels/:hotelId/rooms - Get all rooms for a hotel
router.get('/:hotelId/rooms', async (req, res) => {
  try {
    const { hotelId } = req.params;
    console.log('API: Fetching rooms for hotel ID:', hotelId);

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const transformedHotel = transformHotelForFrontend(hotel);
    res.json(transformedHotel.rooms);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ message: 'Error fetching rooms', error: error.message });
  }
});

// GET /api/hotels/:hotelId/rooms/:roomId - Get a specific room
router.get('/:hotelId/rooms/:roomId', async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    console.log(`API: Fetching room ${roomId} for hotel ${hotelId}`);

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const room = hotel.rooms.id(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Transform room for frontend
    const transformedRoom = {
      _id: room._id.toString(),
      type: room.type,
      description: room.description,
      pricePerNight: room.pricePerNight,
      maxGuests: room.maxGuests,
      amenities: room.amenities || [],
      images: (room.images || []).map(image => {
        if (typeof image === 'string') {
          return { url: image, alt: `${room.type} view` };
        }
        return image;
      })
    };

    res.json(transformedRoom);
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ message: 'Error fetching room', error: error.message });
  }
});

// POST /api/hotels/:hotelId/rooms - Add a new room to a hotel
router.post('/:hotelId/rooms', async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { type, pricePerNight, maxGuests, description, amenities, images } = req.body;

    console.log(`API: Adding new room to hotel ${hotelId}`);

    // Basic validation
    if (!type || pricePerNight === undefined || maxGuests === undefined) {
      return res.status(400).json({ message: 'Type, price, and max guests are required' });
    }

    // Validate room amenities if provided
    if (amenities && !validateRoomAmenities(amenities)) {
      return res.status(400).json({
        message: 'Invalid room amenities provided',
        validAmenities: roomAmenities
      });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Create new room
    const newRoom = {
      type,
      pricePerNight: Number(pricePerNight),
      maxGuests: Number(maxGuests),
      description: description || '',
      amenities: amenities || [],
      images: images || [{
        url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a',
        alt: 'Default Room Image'
      }]
    };

    // Add room to hotel
    hotel.rooms.push(newRoom);
    await hotel.save();

    // Return the newly created room
    const createdRoom = hotel.rooms[hotel.rooms.length - 1];
    res.status(201).json({
      _id: createdRoom._id.toString(),
      ...newRoom
    });
  } catch (error) {
    console.error('Error adding room:', error);
    res.status(500).json({ message: 'Error adding room', error: error.message });
  }
});

// PUT /api/hotels/:hotelId/rooms/:roomId - Update a room
router.put('/:hotelId/rooms/:roomId', async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    const { type, pricePerNight, maxGuests, description, amenities, images } = req.body;

    console.log(`API: Updating room ${roomId} for hotel ${hotelId}`);

    // Validate room amenities if provided
    if (amenities && !validateRoomAmenities(amenities)) {
      return res.status(400).json({
        message: 'Invalid room amenities provided',
        validAmenities: roomAmenities
      });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const room = hotel.rooms.id(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Update room fields if provided
    if (type) room.type = type;
    if (pricePerNight !== undefined) room.pricePerNight = Number(pricePerNight);
    if (maxGuests !== undefined) room.maxGuests = Number(maxGuests);
    if (description !== undefined) room.description = description;
    if (amenities) room.amenities = amenities;
    if (images) room.images = images;

    await hotel.save();

    // Transform room for frontend
    const updatedRoom = {
      _id: room._id.toString(),
      type: room.type,
      description: room.description,
      pricePerNight: room.pricePerNight,
      maxGuests: room.maxGuests,
      amenities: room.amenities || [],
      images: (room.images || []).map(image => {
        if (typeof image === 'string') {
          return { url: image, alt: `${room.type} view` };
        }
        return image;
      })
    };

    res.json(updatedRoom);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Error updating room', error: error.message });
  }
});

// DELETE /api/hotels/:hotelId/rooms/:roomId - Delete a room
router.delete('/:hotelId/rooms/:roomId', async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    console.log(`API: Deleting room ${roomId} from hotel ${hotelId}`);

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const roomIndex = hotel.rooms.findIndex(room => room._id.toString() === roomId);
    if (roomIndex === -1) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Remove the room
    hotel.rooms.splice(roomIndex, 1);
    await hotel.save();

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ message: 'Error deleting room', error: error.message });
  }
});

module.exports = router; 