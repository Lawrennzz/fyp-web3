const nodemailer = require('nodemailer');
const config = require('../config');

class NotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.emailService.user,
        pass: config.emailService.password
      }
    });
  }

  // Send payment success notification
  async sendPaymentSuccess(bookingData) {
    const {
      guestEmail,
      guestName,
      hotelName,
      roomType,
      checkIn,
      checkOut,
      totalAmount,
      invoiceNumber
    } = bookingData;

    const mailOptions = {
      from: config.emailService.user,
      to: guestEmail,
      subject: 'Payment Successful - Travel.Go Booking Confirmation',
      html: `
        <h2>Payment Successful!</h2>
        <p>Dear ${guestName},</p>
        <p>Your payment for booking at ${hotelName} has been successfully processed.</p>
        
        <h3>Booking Details:</h3>
        <ul>
          <li>Hotel: ${hotelName}</li>
          <li>Room Type: ${roomType}</li>
          <li>Check-in: ${new Date(checkIn).toLocaleDateString()}</li>
          <li>Check-out: ${new Date(checkOut).toLocaleDateString()}</li>
          <li>Total Amount: $${totalAmount}</li>
          <li>Invoice Number: ${invoiceNumber}</li>
        </ul>
        
        <p>You can download your invoice from your booking dashboard.</p>
        
        <p>Thank you for choosing Travel.Go!</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending payment success email:', error);
      return false;
    }
  }

  // Send payment failure notification
  async sendPaymentFailure(bookingData, error) {
    const {
      guestEmail,
      guestName,
      hotelName,
      totalAmount
    } = bookingData;

    const mailOptions = {
      from: config.emailService.user,
      to: guestEmail,
      subject: 'Payment Failed - Travel.Go Booking',
      html: `
        <h2>Payment Failed</h2>
        <p>Dear ${guestName},</p>
        <p>We regret to inform you that your payment for booking at ${hotelName} has failed.</p>
        
        <h3>Payment Details:</h3>
        <ul>
          <li>Amount: $${totalAmount}</li>
          <li>Error: ${error.message || 'Unknown error'}</li>
        </ul>
        
        <p>Please try again or contact our support team if you need assistance.</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending payment failure email:', error);
      return false;
    }
  }

  // Send refund notification
  async sendRefundNotification(bookingData) {
    const {
      guestEmail,
      guestName,
      hotelName,
      totalAmount,
      refundAmount
    } = bookingData;

    const mailOptions = {
      from: config.emailService.user,
      to: guestEmail,
      subject: 'Refund Processed - Travel.Go',
      html: `
        <h2>Refund Processed</h2>
        <p>Dear ${guestName},</p>
        <p>Your refund for the cancelled booking at ${hotelName} has been processed.</p>
        
        <h3>Refund Details:</h3>
        <ul>
          <li>Original Amount: $${totalAmount}</li>
          <li>Refunded Amount: $${refundAmount}</li>
        </ul>
        
        <p>The refund will be credited to your original payment method within 5-7 business days.</p>
        
        <p>Thank you for your understanding.</p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending refund notification email:', error);
      return false;
    }
  }
}

module.exports = new NotificationService(); 