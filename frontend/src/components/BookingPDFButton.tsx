import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { IoDocumentText } from 'react-icons/io5';
import { format } from 'date-fns';

interface BookingPDFButtonProps {
    booking: any;
    className?: string;
}

const BookingPDFButton: React.FC<BookingPDFButtonProps> = ({ booking, className }) => {
    const generatePDF = async () => {
        // Create a new PDF document
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Set font sizes
        const titleFontSize = 16;
        const headingFontSize = 12;
        const normalFontSize = 10;
        const smallFontSize = 8;

        // Set margins
        const margin = 20;
        let yPos = margin;

        // Add hotel name as title
        pdf.setFontSize(titleFontSize);
        pdf.setFont('helvetica', 'bold');
        pdf.text(booking.hotelDetails.name, margin, yPos);
        yPos += 10;

        // Add booking status
        pdf.setFontSize(normalFontSize);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Status: ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}`, margin, yPos);
        yPos += 10;

        // Add location
        pdf.text(`Location: ${booking.hotelDetails.location.address}, ${booking.hotelDetails.location.city}, ${booking.hotelDetails.location.country}`, margin, yPos);
        yPos += 15;

        // Add booking details section
        pdf.setFontSize(headingFontSize);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Booking Details', margin, yPos);
        yPos += 7;

        // Add booking details
        pdf.setFontSize(normalFontSize);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Booking ID: ${booking.id}`, margin, yPos);
        yPos += 7;
        pdf.text(`Room Type: ${booking.roomDetails.type}`, margin, yPos);
        yPos += 7;
        pdf.text(`Guests: ${booking.guests} ${booking.guests === 1 ? 'Guest' : 'Guests'}`, margin, yPos);
        yPos += 7;
        pdf.text(`Check-in: ${format(booking.checkIn.toDate(), 'PPP')}`, margin, yPos);
        yPos += 7;
        pdf.text(`Check-out: ${format(booking.checkOut.toDate(), 'PPP')}`, margin, yPos);
        yPos += 7;
        pdf.text(`Total Price: $${booking.totalPrice} USDT`, margin, yPos);
        yPos += 15;

        // Add guest information section
        pdf.setFontSize(headingFontSize);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Guest Information', margin, yPos);
        yPos += 7;

        // Add guest information
        pdf.setFontSize(normalFontSize);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Name: ${booking.guestInfo.firstName} ${booking.guestInfo.lastName}`, margin, yPos);
        yPos += 7;
        pdf.text(`Email: ${booking.guestInfo.email}`, margin, yPos);
        yPos += 7;
        pdf.text(`Phone: ${booking.guestInfo.phone}`, margin, yPos);
        yPos += 15;

        // Add room amenities section if available
        if (booking.roomDetails.amenities && booking.roomDetails.amenities.length > 0) {
            pdf.setFontSize(headingFontSize);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Room Amenities', margin, yPos);
            yPos += 7;

            pdf.setFontSize(normalFontSize);
            pdf.setFont('helvetica', 'normal');
            pdf.text(booking.roomDetails.amenities.join(', '), margin, yPos);
            yPos += 15;
        }

        // Add transaction information
        pdf.setFontSize(headingFontSize);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Transaction Information', margin, yPos);
        yPos += 7;

        pdf.setFontSize(normalFontSize);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Transaction Hash: ${booking.transactionHash}`, margin, yPos);
        yPos += 15;

        // Add footer with date
        pdf.setFontSize(smallFontSize);
        pdf.text(`Generated on ${format(new Date(), 'PPP')}`, margin, pdf.internal.pageSize.height - 10);

        // Save the PDF
        pdf.save(`booking-${booking.id}.pdf`);
    };

    // Default style for the booking list view
    const defaultClassName = "flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300";

    // Print view style - a button that matches the other buttons in the print view
    const printViewClassName = "px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600";

    return (
        <button
            onClick={generatePDF}
            className={className || defaultClassName}
        >
            <IoDocumentText size={className ? 20 : 16} className={className ? "mr-2" : ""} />
            Download PDF
        </button>
    );
};

export default BookingPDFButton; 