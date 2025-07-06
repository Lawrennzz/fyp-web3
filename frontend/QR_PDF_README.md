# QR Code and PDF Generation for Travel.Go

This document explains how to use the QR code and PDF generation features in the Travel.Go application.

## QR Code Generation

QR codes are generated for each booking and can be used for:
- Quick check-in at hotels
- Verification of booking details
- Sharing booking information

### Accessing QR Codes

1. Navigate to the "My Bookings" page
2. Click on "Generate QR Code" for any booking
3. A modal will appear with the QR code
4. Scan the QR code to view booking details

## PDF Generation

PDF documents can be generated for each booking and contain:
- Hotel information
- Booking details (check-in/check-out dates, room type)
- Guest information
- Transaction details

### Generating PDFs

1. Navigate to the "My Bookings" page
2. Click on "Download PDF" for any booking
3. The PDF will be automatically downloaded
4. You can also generate a PDF from the booking confirmation page

## Mobile Access with Ngrok

### Using Command Line (Original Method)

To make your local development server accessible from mobile devices:

1. Run the ngrok command:
   ```
   npx ngrok http 3000
   ```
2. Copy the generated URL
3. Access this URL from any mobile device

### Using Ngrok Dashboard (No Command Line)

For a more user-friendly approach without using command line:

1. Open `ngrok-mobile-connect.html` in your browser
2. Follow the steps to create an endpoint in the ngrok dashboard
3. Copy the URL from the dashboard
4. Paste it into the tool to generate a QR code
5. Scan the QR code with your mobile device

#### Steps to Use Ngrok Dashboard:

1. Go to https://dashboard.ngrok.com/endpoints
2. Click "New Endpoint"
3. Select "HTTP / HTTPS" as the type
4. Enter port 3000 (or your app's port)
5. Click "Create Endpoint"
6. Copy the generated URL
7. Use it to access your app from any device

For more detailed instructions, see `ngrok-dashboard.md`

## Troubleshooting

- Ensure your local development server is running (`npm run dev`)
- QR codes require an internet connection to access
- For mobile access, both devices must be connected to the internet 