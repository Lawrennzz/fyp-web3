# Travel.Go - Web3 Hotel Booking Platform

A decentralized hotel booking platform built on blockchain technology that combines the transparency and security of smart contracts with traditional web functionality. Travel.Go enables hotel owners to list properties and guests to make secure, permanent bookings using cryptocurrency.

## 🌟 Features

### For Guests
- **Browse Hotels**: Explore available hotels with high-quality images and detailed information
- **Book Rooms**: Make secure bookings using cryptocurrency (USDT)
- **View Bookings**: Access your booking history and status in real-time
- **Social Login**: Sign up with Google, Email, or other providers
- **Wallet Integration**: Connect MetaMask or use social wallet
- **QR Code Confirmation**: Generate QR codes for booking confirmations
- **PDF Receipts**: Download booking receipts and invoices

### For Hotel Owners
- **Hotel Management**: Register and manage hotel listings
- **Room Management**: Add and configure rooms with pricing
- **Booking Dashboard**: Track bookings, revenue, and occupancy
- **IPFS Image Storage**: Permanently store hotel and room images on decentralized IPFS
- **Blockchain Payments**: Receive instant, secure payments via smart contracts

### Technical Features
- **Smart Contracts**: Secure, transparent booking logic on Ethereum/Polygon
- **IPFS Storage**: Decentralized image storage via Pinata
- **Firebase Integration**: User authentication and real-time data sync
- **Web3 Integration**: MetaMask and WalletConnect support
- **Responsive Design**: Mobile-friendly interface built with Next.js and Tailwind CSS
- **PDF Generation**: Automated booking confirmations and invoices
- **QR Code System**: Digital booking verifications

## 🏗️ Architecture

### Tech Stack

**Frontend**
- Next.js 13+ (React framework)
- TypeScript
- Tailwind CSS
- Ethers.js / Web3.js
- Firebase (Auth, Firestore, Storage)
- Pinata SDK (IPFS)

**Backend**
- Node.js with Express
- MongoDB
- Firebase Admin SDK
- PDFKit (invoice generation)
- Nodemailer (notifications)

**Blockchain**
- Solidity ^0.8.19
- Hardhat (development framework)
- OpenZeppelin (security libraries)
- ERC20 Token (USDT) for payments

**Infrastructure**
- Docker & Docker Compose
- ngrok (local development)
- Vercel (frontend deployment)

### Project Structure

```
travel-go/
├── frontend/           # Next.js application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Next.js pages
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   ├── config/         # Configuration files
│   │   └── contracts/      # Smart contract ABIs
│   └── public/          # Static assets
├── backend/            # Express API server
│   ├── routes/         # API routes
│   ├── models/         # MongoDB models
│   ├── services/       # Business logic
│   └── utils/          # Helper functions
├── contracts/          # Smart contracts
│   ├── contracts/      # Solidity source files
│   ├── scripts/        # Deployment scripts
│   └── test/           # Contract tests
└── docker-compose.yml  # Local development setup
```

## 🚀 Getting Started

### Prerequisites

- Node.js v16+ and npm
- MongoDB (local or cloud)
- MetaMask browser extension
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd travel-go
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**

   **Frontend** (`frontend/.env.local`):
   ```env
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_PINATA_API_KEY=your_pinata_api_key
   REACT_APP_PINATA_API_SECRET=your_pinata_api_secret
   NEXT_PUBLIC_RPC_URL=your_rpc_url
   ```

   **Backend** (`backend/.env`):
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/travel_go
   FIREBASE_ADMIN_CREDENTIALS=your_firebase_admin_credentials
   ```

   **Contracts** (`contracts/.env`):
   ```env
   PRIVATE_KEY=your_wallet_private_key
   SEPOLIA_RPC_URL=your_sepolia_rpc_url
   POLYGON_MUMBAI_RPC_URL=your_mumbai_rpc_url
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

### Running Locally

1. **Start MongoDB and Ganache** (using Docker)
   ```bash
   docker-compose up -d
   ```

2. **Deploy smart contracts** (optional - use testnet)
   ```bash
   cd contracts
   npm run deploy:local
   ```

3. **Start backend server**
   ```bash
   cd backend
   npm run dev
   ```

4. **Start frontend**
   ```bash
   cd frontend
   npm run dev
   ```

Visit `http://localhost:3000` to access the application.

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Comprehensive deployment instructions
- [IPFS Integration Guide](./IPFS_Integration_Guide.md) - IPFS/Pinata setup
- [Smart Contract Report](./Smart_Contract_Development_Report.md) - Contract architecture
- [Contracts README](./contracts/README.md) - Smart contract development

## 🔐 Security

- **Smart Contract Security**: OpenZeppelin libraries, reentrancy guards, access controls
- **Firebase Security**: Comprehensive Firestore security rules
- **Environment Variables**: Sensitive data never committed to git
- **Input Validation**: Server-side and client-side validation
- **HTTPS**: All production traffic encrypted

## 🧪 Testing

```bash
# Test smart contracts
cd contracts
npm run test

# Lint frontend
cd frontend
npm run lint

# Type check
cd frontend
npx tsc --noEmit
```

## 📦 Deployment

### Smart Contract Deployment

**Sepolia Testnet:**
```bash
cd contracts
npm run deploy-and-update:sepolia
```

**Polygon Mumbai:**
```bash
cd contracts
npm run deploy-and-update:mumbai
```

### Frontend Deployment

Deploy to Vercel:
```bash
cd frontend
vercel --prod
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- OpenZeppelin for security libraries
- Hardhat for development framework
- Firebase for backend services
- Pinata for IPFS hosting
- Vercel for hosting infrastructure

## 🔗 Links

- **Frontend**: [Live Site](https://your-frontend.vercel.app)
- **Smart Contract**: [Etherscan](https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS)
- **Documentation**: See `/docs` folder

## 📊 Current Status

- ✅ Smart Contract Development
- ✅ Frontend UI/UX
- ✅ Backend API
- ✅ IPFS Integration
- ✅ Authentication System
- ✅ Booking Flow
- ✅ PDF Generation
- 🔄 Payment Gateway Integration
- 🔄 Advanced Analytics
- 🔄 Mobile App

## 🐛 Known Issues

- Social wallets are read-only (no gas payments)
- Requires manual gas management
- Limited browser compatibility

## 💬 Support

For support, email support@travelgo.com or create an issue in this repository.

---

Built with ❤️ using Next.js, Solidity, and Web3 technologies.

