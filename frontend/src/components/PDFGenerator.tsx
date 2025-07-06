import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { IoDocumentText } from 'react-icons/io5';

interface PDFGeneratorProps {
    contentRef: React.RefObject<HTMLElement>;
    fileName?: string;
    buttonText?: string;
    className?: string;
}

const PDFGenerator: React.FC<PDFGeneratorProps> = ({
    contentRef,
    fileName = 'download',
    buttonText = 'Download PDF',
    className = '',
}) => {
    const generatePDF = async () => {
        if (!contentRef.current) return;

        try {
            // Create a new jsPDF instance
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            // Get the HTML element to convert
            const element = contentRef.current;

            // Apply special styles for PDF generation
            const originalStyle = element.getAttribute('style') || '';
            element.setAttribute('style', `${originalStyle}; background-color: white !important; color: black !important; padding: 20px;`);

            // Convert the element to canvas
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
            });

            // Restore original styles
            element.setAttribute('style', originalStyle);

            // Convert canvas to image
            const imgData = canvas.toDataURL('image/png');

            // Calculate dimensions
            const imgWidth = 210; // A4 width in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Add image to PDF
            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

            // Save the PDF
            pdf.save(`${fileName}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    return (
        <button
            onClick={generatePDF}
            className={`flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${className}`}
        >
            <IoDocumentText size={16} />
            {buttonText}
        </button>
    );
};

export default PDFGenerator; 