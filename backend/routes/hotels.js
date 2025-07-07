const express = require('express');
const router = express.Router();
const Hotel = require('../models/Hotel');
const InvoiceGenerator = require('../utils/invoiceGenerator');
const path = require('path');

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

  // Transform hotel images
  const transformedImages = (hotelObj.images || []).map(image => {
    if (typeof image === 'string') {
      return { url: image, alt: hotelObj.name };
    }
    return image;
  });

  return {
    _id: hotelObj._id.toString(),
    name: hotelObj.name || '',
    location: {
      city: hotelObj.location?.city || '',
      country: hotelObj.location?.country || '',
      address: hotelObj.location?.address || '',
      coordinates: hotelObj.location?.coordinates || null
    },
    rating: Math.min(5, Math.round((hotelObj.rating || 0) / 2)), // Convert 10-point scale to 5-point scale
    image: transformedImages.length > 0 ? transformedImages[0].url : '/images/placeholder-hotel.jpg',
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

// GET /api/hotels - Get all hotels with optional filters
router.get('/', async (req, res) => {
  try {
    const { location, checkIn, checkOut, guests, minPrice, maxPrice, amenities, rating } = req.query;

    let query = {};

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

    const hotels = await Hotel.find(query)
      .select('name description location image images rating amenities rooms')
      .sort({ rating: -1 });

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
      res.json(hotels);
    }
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({ message: 'Error fetching hotels', error: error.message });
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

// GET /api/hotels/:id - Get a specific hotel
router.get('/:id', async (req, res) => {
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

// GET /api/hotels/owner/:ownerId - Get hotels for a specific owner
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const { ownerId } = req.params;

    if (!ownerId) {
      return res.status(400).json({ message: 'Owner ID is required' });
    }

    const hotels = await Hotel.find({ ownerId });

    const transformedHotels = hotels.map(transformHotelForFrontend)
      .filter(hotel => hotel !== null);

    res.json(transformedHotels);
  } catch (error) {
    console.error('Error fetching owner hotels:', error);
    res.status(500).json({ message: 'Error fetching owner hotels', error: error.message });
  }
});

// POST /api/hotels - Create new hotel
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

// POST /api/hotels/:id/rooms - Add a room to a hotel
router.post('/:id/rooms', async (req, res) => {
  try {
    const { id } = req.params;
    const roomData = req.body;

    // Find the hotel
    const hotel = await Hotel.findById(id);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Validate room data
    if (!roomData.type || !roomData.pricePerNight || !roomData.maxGuests) {
      return res.status(400).json({ message: 'Missing required room fields' });
    }

    // Validate room amenities if provided
    if (roomData.amenities && !validateAmenities(roomData.amenities)) {
      return res.status(400).json({
        message: 'Invalid room amenities. Must be from the standard list.',
        validAmenities: standardAmenities
      });
    }

    // Add the room to the hotel
    hotel.rooms.push(roomData);
    await hotel.save();

    res.status(201).json(hotel);
  } catch (error) {
    console.error('Error adding room:', error);
    res.status(500).json({ message: 'Error adding room', error: error.message });
  }
});

// PUT /api/hotels/:hotelId/rooms/:roomId - Update a room
router.put('/:hotelId/rooms/:roomId', async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;
    const updates = req.body;

    // Find the hotel
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Find the room
    const roomIndex = hotel.rooms.findIndex(room => room._id.toString() === roomId);
    if (roomIndex === -1) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Validate room amenities if they're being updated
    if (updates.amenities && !validateAmenities(updates.amenities)) {
      return res.status(400).json({
        message: 'Invalid room amenities. Must be from the standard list.',
        validAmenities: standardAmenities
      });
    }

    // Update room fields
    Object.keys(updates).forEach(key => {
      hotel.rooms[roomIndex][key] = updates[key];
    });

    await hotel.save();

    res.json(hotel);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ message: 'Error updating room', error: error.message });
  }
});

// DELETE /api/hotels/:hotelId/rooms/:roomId - Delete a room
router.delete('/:hotelId/rooms/:roomId', async (req, res) => {
  try {
    const { hotelId, roomId } = req.params;

    // Find the hotel
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Remove the room
    hotel.rooms = hotel.rooms.filter(room => room._id.toString() !== roomId);
    await hotel.save();

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ message: 'Error deleting room', error: error.message });
  }
});

// Generate booking confirmation document
router.get('/booking-confirmation/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Get booking data from Firebase
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const bookingData = bookingDoc.data();

    // Generate the confirmation document
    const invoiceGenerator = new InvoiceGenerator();
    const { invoiceNumber, path: invoicePath } = await invoiceGenerator.generateInvoice({
      bookingId,
      guestName: `${bookingData.guestInfo.firstName} ${bookingData.guestInfo.lastName}`,
      guestEmail: bookingData.guestInfo.email,
      hotelName: bookingData.hotelDetails.name,
      roomType: bookingData.roomDetails.type,
      checkIn: bookingData.checkIn.toDate(),
      checkOut: bookingData.checkOut.toDate(),
      totalAmount: bookingData.totalPrice,
      paymentMethod: 'USDT',
      transactionHash: bookingData.transactionHash
    });

    // Send the PDF file
    res.sendFile(invoicePath);
  } catch (error) {
    console.error('Error generating booking confirmation:', error);
    res.status(500).json({ error: 'Failed to generate booking confirmation' });
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