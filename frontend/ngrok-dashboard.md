# Using Ngrok for Mobile Access

## Option 1: One-Click Setup (Recommended)

1. **Use the Automated Setup**
   - Double-click `start-mobile-connect.bat` in the project root
   - This will:
     - Check if your Next.js server is running
     - Start ngrok automatically
     - Open the Mobile Connect tool
     - Auto-detect the ngrok URL
     - Generate a QR code for mobile access

2. **Scan the QR Code**
   - Use your mobile device to scan the QR code
   - Access your app from anywhere

## Option 2: Manual Setup

### Using the Command Line

1. **Start your Next.js development server**
   ```
   cd frontend
   npm run dev
   ```

2. **Start ngrok in a separate terminal**
   ```
   npx ngrok http 3000
   ```

3. **Get the ngrok URL**
   - Look for a line that says "Forwarding" followed by a URL
   - The URL will look like: `https://xxxx-xxx-xxx-xxx.ngrok-free.app`

4. **Open the Mobile Connect Tool**
   - Double-click `open-mobile-connect.bat`
   - Enter the ngrok URL
   - Generate a QR code

## Option 3: Using the Ngrok Dashboard (Paid Plans Only)

If you have a paid ngrok plan, you can use the dashboard to create endpoints:

1. **Login to Ngrok Dashboard**
   - Go to https://dashboard.ngrok.com/endpoints
   - Login with your ngrok account

2. **Create a New Endpoint**
   - Click the "New Endpoint" button
   - Select "HTTP / HTTPS" as the type
   - In the "Port" field, enter `3000`
   - Click "Create Endpoint"

3. **Access Your App**
   - After creating the endpoint, you'll receive a URL
   - This URL can be accessed from any device with internet connection

## Important Notes

- The free tier of ngrok will generate a new URL each time
- For persistent URLs, consider upgrading to a paid plan
- Make sure your local development server is running (`npm run dev`)
- The Mobile Connect tool can auto-detect your ngrok URL

## Benefits
- No command line required
- Persistent URLs available (with paid plans)
- Easy to share access with others
- Dashboard provides traffic inspection and analytics 