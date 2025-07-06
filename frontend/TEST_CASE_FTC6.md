# Test Case FTC-6: Hotel Owner Registration

## Test Information
- **Test Number**: 6
- **Test Subject**: Hotel Owners
- **Objective**: Allow hotel owners to register new property on the platform

## Test Procedure

### 1. Connect wallet as hotel owner
- Navigate to the application
- Click on "Connect Wallet" button
- Connect using MetaMask or other supported wallet provider
- Ensure the wallet has enough ETH for gas fees

### 2. Access hotel registration form
- Navigate to Admin Dashboard
- Click on "Register New Hotel" button
- Verify the hotel registration form loads correctly

### 3. Fill in hotel details
- Enter hotel name
- Enter hotel description
- Enter location details (city, country, address)
- Select amenities offered by the hotel
- Verify all required fields have validation

### 4. Upload hotel images to IPFS storage
- Click on the image upload area
- Select images to upload
- Verify images are uploaded to IPFS
- Verify image previews are displayed
- Add room details and upload room images

### 5. Submit registration and pay gas fees
- Click "Register Hotel" button
- Confirm the transaction in MetaMask
- Pay the required gas fees
- Wait for transaction confirmation

### 6. Check hotel registration on blockchain
- Verify transaction success message
- Check transaction hash on Etherscan
- Verify hotel is added to the hotel list
- Verify hotel details are correctly stored in Firebase

## Expected Results
- Hotel is successfully registered on the blockchain
- Hotel details are stored in Firebase database
- Hotel appears in the hotel listings
- Hotel owner can manage their hotel properties

## Implementation Notes
- The hotel registration process involves both blockchain and database operations
- Hotel images are stored on IPFS for decentralized storage
- Basic hotel details are stored on the blockchain
- Detailed information is stored in Firebase for better query performance
- Hotel owners need to be authenticated and have their wallet connected

## Testing Environment
- Network: Sepolia Testnet
- Smart Contract: HotelBooking.sol
- Browser: Chrome with MetaMask extension
- Test Account: Hotel owner account with ETH balance 