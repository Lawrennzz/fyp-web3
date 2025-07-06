import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { IoClose, IoDownload, IoShare, IoQrCode, IoScan } from 'react-icons/io5';

interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    bookingData: any;
}

export default function QRCodeModal({ isOpen, onClose, bookingId, bookingData }: QRCodeModalProps) {
    const [qrValue, setQrValue] = useState('');
    const [publicUrl, setPublicUrl] = useState('');
    const [qrServerUrl, setQrServerUrl] = useState('');

    useEffect(() => {
        // Try to get the ngrok URL from localStorage if it exists
        const savedNgrokUrl = localStorage.getItem('ngrokUrl');
        if (savedNgrokUrl) {
            setPublicUrl(savedNgrokUrl);
        } else {
            // If no ngrok URL is saved, use the local URL
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            setPublicUrl(baseUrl);
        }

        // Set the QR server URL
        setQrServerUrl(`http://localhost:8080/qr/${bookingId}`);
    }, [bookingId]);

    useEffect(() => {
        if (isOpen && bookingId && publicUrl) {
            // Create a URL that will contain the booking confirmation data
            const confirmationUrl = `${publicUrl}/booking-confirmation/${bookingId}`;
            setQrValue(confirmationUrl);
        }
    }, [isOpen, bookingId, publicUrl]);

    const downloadQRCode = () => {
        const svg = document.querySelector('#qr-code svg') as SVGElement;
        if (svg) {
            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
                const pngFile = canvas.toDataURL('image/png');

                const downloadLink = document.createElement('a');
                downloadLink.download = `booking-qr-${bookingId}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            };

            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        }
    };

    const shareQRCode = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Booking Confirmation QR Code',
                    text: `Scan this QR code to view your booking confirmation for ${bookingData?.hotelDetails?.name}`,
                    url: qrValue
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            // Fallback: copy to clipboard
            try {
                await navigator.clipboard.writeText(qrValue);
                alert('QR code URL copied to clipboard!');
            } catch (error) {
                console.log('Error copying to clipboard:', error);
            }
        }
    };

    const handleNgrokUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = e.target.value;
        setPublicUrl(newUrl);
        localStorage.setItem('ngrokUrl', newUrl);
    };

    const openQrServerUrl = () => {
        window.open(qrServerUrl, '_blank');
    };

    const openScanner = () => {
        window.open('/scanner.html', '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-[#1E293B] rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#1E293B] pb-2">
                    <h2 className="text-xl font-semibold">Booking QR Code</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2"
                        aria-label="Close"
                    >
                        <IoClose size={24} />
                    </button>
                </div>

                <div className="mb-4">
                    <label className="text-sm text-gray-400 mb-1 block">
                        Public URL (use ngrok for mobile access)
                    </label>
                    <input
                        type="text"
                        value={publicUrl}
                        onChange={handleNgrokUrlChange}
                        placeholder="https://your-ngrok-url.ngrok.io"
                        className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        To use ngrok, run: ngrok http 3000
                    </p>
                </div>

                <div className="text-center mb-6">
                    <p className="text-gray-400 mb-4">
                        Scan this QR code to view your booking confirmation
                    </p>

                    <div id="qr-code" className="flex justify-center mb-4">
                        <div className="bg-white p-4 rounded-lg">
                            {qrValue && (
                                <QRCode
                                    value={qrValue}
                                    size={200}
                                    level="H"
                                    title="Booking Confirmation QR Code"
                                />
                            )}
                        </div>
                    </div>

                    <div className="text-sm text-gray-400 mb-4">
                        <p className="font-medium text-white">{bookingData?.hotelDetails?.name}</p>
                        <p>{bookingData?.roomDetails?.type}</p>
                        <p>Booking ID: {bookingId}</p>
                        <p className="text-xs mt-2 text-gray-500">URL: {qrValue}</p>
                    </div>
                </div>

                <div className="flex gap-3 mb-4">
                    <button
                        onClick={downloadQRCode}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                    >
                        <IoDownload size={16} />
                        Download
                    </button>
                    <button
                        onClick={shareQRCode}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                    >
                        <IoShare size={16} />
                        Share
                    </button>
                </div>

                <div className="border-t border-gray-700 pt-4 mt-2">
                    <p className="text-sm text-gray-400 mb-2">Alternative QR Code Options:</p>
                    <div className="flex gap-3 mb-4">
                        <button
                            onClick={openQrServerUrl}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                        >
                            <IoQrCode size={16} />
                            Data QR Code
                        </button>
                        <button
                            onClick={openScanner}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                        >
                            <IoScan size={16} />
                            Open Scanner
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        These options work better on mobile devices
                    </p>
                </div>

                <div className="mt-4 text-center">
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
} 