const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// Edit booking (one-time only)
router.put('/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'confirmed') return res.status(400).json({ message: 'Can only edit confirmed bookings' });
        if (booking.editRequested) return res.status(400).json({ message: 'Edit already requested for this booking' });
        if (new Date(booking.checkIn) <= new Date()) return res.status(400).json({ message: 'Cannot edit a booking that has started' });

        // Only allow certain fields to be updated
        const allowedFields = ['checkIn', 'checkOut', 'guests', 'guestInfo'];
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) booking[field] = req.body[field];
        });
        booking.editRequested = true;
        booking.updatedAt = new Date();
        await booking.save();
        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Cancel booking (set refunded to false, frontend should trigger refund)
router.delete('/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'confirmed') return res.status(400).json({ message: 'Can only cancel confirmed bookings' });
        if (new Date(booking.checkIn) <= new Date()) return res.status(400).json({ message: 'Cannot cancel a booking that has started' });

        booking.status = 'cancelled';
        booking.refunded = false;
        booking.updatedAt = new Date();
        await booking.save();
        res.json({ message: 'Booking cancelled. Please initiate refund via MetaMask.', booking });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 