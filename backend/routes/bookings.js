const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// Edit booking
router.put('/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'active') return res.status(400).json({ message: 'Cannot edit a non-active booking' });
        if (new Date(booking.checkIn) <= new Date()) return res.status(400).json({ message: 'Cannot edit a booking that has started' });

        // Only allow certain fields to be updated
        const allowedFields = ['checkIn', 'checkOut', 'guests', 'guestInfo'];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) booking[field] = req.body[field];
        });
        booking.updatedAt = new Date();
        await booking.save();
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Cancel booking
router.delete('/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'active') return res.status(400).json({ message: 'Cannot cancel a non-active booking' });
        if (new Date(booking.checkIn) <= new Date()) return res.status(400).json({ message: 'Cannot cancel a booking that has started' });

        booking.status = 'cancelled';
        booking.updatedAt = new Date();
        await booking.save();
        res.json({ message: 'Booking cancelled', booking });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 