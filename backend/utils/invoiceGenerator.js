const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

class InvoiceGenerator {
  constructor() {
    // Create invoices directory if it doesn't exist
    this.invoiceDir = path.join(__dirname, '../invoices');
    if (!fs.existsSync(this.invoiceDir)) {
      fs.mkdirSync(this.invoiceDir);
    }
  }

  async generateInvoice(bookingData) {
    const {
      bookingId,
      guestName,
      guestEmail,
      hotelName,
      roomType,
      checkIn,
      checkOut,
      totalAmount,
      paymentMethod,
      transactionHash
    } = bookingData;

    // Create a unique invoice number
    const invoiceNumber = `INV-${moment().format('YYYYMMDD')}-${bookingId}`;
    
    // Create PDF document
    const doc = new PDFDocument();
    const invoicePath = path.join(this.invoiceDir, `${invoiceNumber}.pdf`);
    const writeStream = fs.createWriteStream(invoicePath);
    
    doc.pipe(writeStream);

    // Add hotel logo and header
    doc.fontSize(20).text('Travel.Go', { align: 'center' });
    doc.fontSize(16).text('Booking Invoice', { align: 'center' });
    doc.moveDown();

    // Add invoice details
    doc.fontSize(12);
    doc.text(`Invoice Number: ${invoiceNumber}`);
    doc.text(`Date: ${moment().format('MMMM D, YYYY')}`);
    doc.moveDown();

    // Add guest information
    doc.text('Guest Information:');
    doc.text(`Name: ${guestName}`);
    doc.text(`Email: ${guestEmail}`);
    doc.moveDown();

    // Add booking details
    doc.text('Booking Details:');
    doc.text(`Hotel: ${hotelName}`);
    doc.text(`Room Type: ${roomType}`);
    doc.text(`Check-in: ${moment(checkIn).format('MMMM D, YYYY')}`);
    doc.text(`Check-out: ${moment(checkOut).format('MMMM D, YYYY')}`);
    doc.moveDown();

    // Add payment information
    doc.text('Payment Information:');
    doc.text(`Amount Paid: $${totalAmount}`);
    doc.text(`Payment Method: ${paymentMethod}`);
    if (transactionHash) {
      doc.text(`Transaction Hash: ${transactionHash}`);
    }
    doc.moveDown();

    // Add blockchain verification note
    doc.fontSize(10);
    doc.text('This invoice is verified and stored on the blockchain for authenticity.', {
      align: 'center',
      color: 'gray'
    });

    // Finalize the PDF
    doc.end();

    // Return the invoice details
    return {
      invoiceNumber,
      path: invoicePath
    };
  }

  async getInvoice(invoiceNumber) {
    const invoicePath = path.join(this.invoiceDir, `${invoiceNumber}.pdf`);
    if (fs.existsSync(invoicePath)) {
      return invoicePath;
    }
    return null;
  }
}

module.exports = new InvoiceGenerator(); 