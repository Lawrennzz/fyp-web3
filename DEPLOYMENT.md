# Travel.Go Deployment Guide

This guide walks through deploying the Travel.Go Web3 hotel booking platform to cloud services.

## Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)
- [MetaMask](https://metamask.io/) wallet with some test ETH on Sepolia or Mumbai networks
- [Infura](https://infura.io/) account
- [Firebase](https://firebase.google.com/) account
- [Pinata](https://pinata.cloud/) account for IPFS storage
- [Vercel](https://vercel.com/) account

## Step 1: Set Up Infura

1. Create an account on [Infura](https://infura.io/)
2. Create a new project
3. Copy your project ID and endpoints

## Step 2: Set Up Firebase

1. Create a [Firebase](https://firebase.google.com/) account
2. Create a new project
3. Enable Firestore Database
   - Go to Firestore Database in the Firebase console
   - Click "Create database"
   - Start in production mode
   - Choose a location close to your users

4. Enable Firebase Storage
   - Go to Storage in the Firebase console
   - Click "Get started"
   - Accept the default settings

5. Enable Firebase Authentication
   - Go to Authentication in the Firebase console
   - Click "Get started"
   - Enable the following sign-in methods:
     - Email/Password
     - Google
     - Facebook (optional, requires Facebook Developer account)
     - Twitter (optional, requires Twitter Developer account)

6. Register your web app
   - Click on the web icon (</>) on the Firebase project overview
   - Register your app with a nickname
   - Copy the Firebase configuration object

7. Create a `.env` file in the `frontend` directory:
   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   REACT_APP_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key
   ```

8. Set up Firestore security rules:
   - Go to Firestore Database > Rules
   - Update the rules to:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /hotels/{hotelId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       match /rooms/{roomId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
       match /bookings/{bookingId} {
         allow read: if request.auth != null && (
           request.auth.uid == resource.data.userAddress || 
           request.auth.uid == resource.data.userId
         );
         allow write: if request.auth != null;
       }
       match /wallets/{userId} {
         allow read: if request.auth != null && request.auth.uid == userId;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

## Step 3: Set Up Pinata for IPFS Storage

1. Create a [Pinata](https://pinata.cloud/) account
2. Generate API keys:
   - Go to Dashboard > API Keys
   - Create a new API key with "pinFileToIPFS" and "pinJSONToIPFS" access
   - Save your API Key and API Secret

3. Add Pinata credentials to your frontend `.env` file:
   ```
   REACT_APP_PINATA_API_KEY=your_pinata_api_key
   REACT_APP_PINATA_API_SECRET=your_pinata_api_secret
   ```

## Step 4: Configure Smart Contract Environment Variables

1. Create a `.env` file in the `contracts` directory:

```
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
POLYGON_MUMBAI_RPC_URL=https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_wallet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
HARDHAT_NETWORK=sepolia
```

⚠️ **WARNING**: Never commit your `.env` files to git! They contain sensitive information.

## Step 5: Deploy Smart Contract

1. Install dependencies:
   ```
   cd contracts
   npm install
   ```

2. Compile the contract:
   ```
   npm run compile
   ```

3. Deploy to Sepolia testnet:
   ```
   npm run deploy:sepolia
   ```
   
   Or to Mumbai testnet:
   ```
   npm run deploy:mumbai
   ```

4. Verify the contract (optional but recommended):
   ```
   npm run verify:sepolia <CONTRACT_ADDRESS>
   ```

## Step 6: Update Frontend Configuration

1. Update the frontend with the deployed contract address:
   ```
   npm run update-frontend:sepolia
   ```

   Or for Mumbai:
   ```
   npm run update-frontend:mumbai
   ```

## Step 7: Install Frontend Dependencies

1. Navigate to the frontend directory:
   ```
   cd ../frontend
   ```

2. Install dependencies:
   ```
   npm install firebase
   npm install @pinata/sdk
   npm install ethers
   npm install @fortawesome/fontawesome-free
   ```

3. Import FontAwesome in your main CSS or index.js file:
   ```javascript
   import '@fortawesome/fontawesome-free/css/all.min.css';
   ```

4. Build the project:
   ```
   npm run build
   ```

## Step 8: Deploy Frontend to Vercel

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Login to Vercel:
   ```
   vercel login
   ```

3. Deploy to Vercel:
   ```
   vercel
   ```

4. Set up environment variables in Vercel:
   - Go to your project in the Vercel dashboard
   - Click on "Settings" > "Environment Variables"
   - Add all Firebase and Pinata environment variables

5. Follow the prompts to configure your project.

6. For production deployment:
   ```
   vercel --prod
   ```

## Step 9: Final Configuration

1. Visit your deployed website on Vercel
2. Connect with MetaMask to interact with the smart contract
3. Test the social login functionality to ensure it works properly
4. Test booking functionality to ensure everything works
5. Verify that data is being stored in Firebase Firestore and images in IPFS

## Social Login Feature

The application now includes a social login feature that allows users to:

1. Create a blockchain wallet without installing MetaMask
2. Login with Google, Email, or other social providers
3. Store wallet information securely in Firebase
4. Interact with smart contract data (read-only)

For transactions that require gas fees, users will need to:
1. Use a faucet to fund their wallet address
2. Use a transaction relay service (optional enhancement)

Note that social login wallets are currently read-only. To enable transactions from social wallets, you would need to implement:
1. A transaction relay server
2. Gas fee sponsorship
3. Meta-transactions

## Maintenance and Updates

When updating the smart contract:

1. Deploy the new version
2. Update the frontend configuration with the new address
3. Redeploy the frontend

## Data Management

The application uses a hybrid data storage approach:

1. **Blockchain (Ethereum)**: Core transaction data including bookings, payments, and hotel/room listings
2. **Firebase Firestore**: Supplementary data like hotel details, room amenities, user profiles
3. **IPFS via Pinata**: Decentralized storage for hotel and room images and metadata
4. **Firebase Storage**: Backup image storage option

## Troubleshooting

- **Smart Contract Issues**: Check transaction logs on [Etherscan](https://sepolia.etherscan.io/) or [Polygonscan](https://mumbai.polygonscan.com/)
- **Frontend Issues**: Check Vercel deployment logs
- **Firebase Issues**: Check Firebase console for errors in Authentication, Firestore, or Storage
- **IPFS Issues**: Check Pinata dashboard for pinning status and gateway availability
- **MetaMask Connection Issues**: Ensure you're on the correct network (Sepolia or Mumbai)

## Security Considerations

- Always use test networks for development
- Audit smart contracts before mainnet deployment
- Set up proper Firebase security rules
- Keep private keys and API keys secure and never expose them
- Use environment variables for sensitive information
- Consider implementing rate limiting for IPFS uploads 