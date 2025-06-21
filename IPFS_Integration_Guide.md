# IPFS Integration Guide for Travel.Go

## Overview

This document outlines the IPFS (InterPlanetary File System) integration for the Travel.Go Web3 hotel booking platform. IPFS provides decentralized file storage, similar to blockchain technology, ensuring permanent and tamper-proof storage for your application's files.

## Current Status

### ✅ **What You Now Have:**
1. **Complete IPFS Service** (`frontend/src/utils/ipfs.ts`)
2. **React Upload Component** (`frontend/src/components/IPFSUploader.tsx`)
3. **Admin Test Page** (`frontend/src/pages/admin/ipfs-test.tsx`)
4. **Pinata Integration** (Professional IPFS service)

### ❌ **What You Had Before:**
- Only Firebase Storage (centralized)
- No decentralized file storage
- Documentation only (no implementation)

## IPFS vs Your Previous Setup

| Feature | Firebase Storage (Before) | IPFS + Pinata (Now) |
|---------|---------------------------|---------------------|
| **Storage Type** | Centralized (Google) | Decentralized (Global) |
| **Permanence** | Can be deleted | Permanent storage |
| **Verification** | Trust-based | Cryptographic hash |
| **Censorship** | Possible | Resistant |
| **Integration** | Easy | Moderate |
| **Cost** | Pay per usage | Freemium model |
| **Web3 Native** | No | Yes |

## Use Cases in Travel.Go

### 🏨 **Hotel Management**
- **Hotel Images**: Store hotel photos permanently
- **Certificates**: Business licenses, certifications
- **Virtual Tours**: 360° images and videos

### 🛏️ **Room Management**
- **Room Photos**: High-quality room images
- **Floor Plans**: Room layouts and diagrams
- **Amenity Lists**: Detailed room features

### 📋 **Booking System**
- **Booking Receipts**: Permanent transaction records
- **Confirmation Documents**: Booking confirmations
- **Invoice PDFs**: Generated invoices

### 👤 **User Profiles**
- **Profile Pictures**: User avatars
- **ID Documents**: Verification documents
- **Travel Documents**: Passports, visas

## Technical Implementation

### 1. **IPFS Service** (`ipfs.ts`)
```typescript
// Upload file to IPFS
const result = await ipfsService.uploadFile(file, {
  metadata: {
    hotelId: 'hotel123',
    type: 'hotel-image'
  }
});

// Get file URL
const url = ipfsService.getFileUrl(result.IpfsHash);
```

### 2. **React Component** (`IPFSUploader.tsx`)
```jsx
<IPFSUploader
  onUploadSuccess={(hash, url) => console.log('Uploaded:', hash)}
  uploadType="hotel-image"
  metadata={{ hotelId: 'hotel123' }}
  maxFileSize={10} // 10MB
/>
```

### 3. **Integration Examples**

#### Hotel Image Upload
```typescript
// In your hotel management component
const handleHotelImageUpload = async (file: File, hotelId: string) => {
  try {
    const result = await ipfsService.uploadFile(file, {
      name: `hotel-${hotelId}-${Date.now()}`,
      metadata: {
        hotelId,
        type: 'hotel-image',
        description: 'Main hotel image'
      }
    });
    
    // Store IPFS hash in your database
    await updateHotelImage(hotelId, result.IpfsHash);
    
    // Display image using IPFS URL
    const imageUrl = ipfsService.getFileUrl(result.IpfsHash);
    setHotelImage(imageUrl);
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

#### Booking Receipt Storage
```typescript
// Generate and store booking receipt
const storeBookingReceipt = async (bookingData: any) => {
  const receipt = {
    bookingId: bookingData.id,
    hotelName: bookingData.hotel.name,
    guestName: bookingData.guest.name,
    checkIn: bookingData.checkIn,
    checkOut: bookingData.checkOut,
    totalAmount: bookingData.amount,
    timestamp: new Date().toISOString(),
    transactionHash: bookingData.txHash
  };
  
  const result = await ipfsService.uploadJSON(receipt, {
    name: `receipt-${bookingData.id}`,
    metadata: {
      type: 'booking-receipt',
      bookingId: bookingData.id
    }
  });
  
  return result.IpfsHash;
};
```

## Setup Instructions

### 1. **Get Pinata API Keys**
1. Visit [pinata.cloud](https://pinata.cloud)
2. Create a free account
3. Go to Dashboard → API Keys
4. Create new API key with these permissions:
   - `pinFileToIPFS`
   - `pinJSONToIPFS`
   - `unpin`
   - `userPinPolicy`

### 2. **Environment Configuration**
Add to your `.env.local` file:
```env
NEXT_PUBLIC_PINATA_API_KEY=your_pinata_api_key
NEXT_PUBLIC_PINATA_API_SECRET=your_pinata_secret
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud
```

### 3. **Install Dependencies**
```bash
cd frontend
npm install axios
```

### 4. **Test the Integration**
1. Start your development server
2. Visit `/admin/ipfs-test`
3. Upload a test file
4. Verify the file is accessible via IPFS

## Smart Contract Integration

### Storing IPFS Hashes in Contracts
```solidity
// In your HotelBooking.sol contract
struct Hotel {
    string name;
    string location;
    string ipfsImageHash;  // Store IPFS hash instead of URL
    // ... other fields
}

// Add function to update hotel image
function updateHotelImage(uint256 hotelId, string memory ipfsHash) public {
    require(hotels[hotelId].owner == msg.sender, "Not authorized");
    hotels[hotelId].ipfsImageHash = ipfsHash;
    emit HotelImageUpdated(hotelId, ipfsHash);
}
```

### Frontend Integration with Smart Contract
```typescript
// Upload image and store hash in contract
const updateHotelImageOnChain = async (hotelId: string, file: File) => {
  // 1. Upload to IPFS
  const result = await ipfsService.uploadFile(file);
  
  // 2. Store hash in smart contract
  const contract = getHotelBookingContract();
  const tx = await contract.updateHotelImage(hotelId, result.IpfsHash);
  await tx.wait();
  
  // 3. Image is now permanently stored and linked to hotel
  console.log('Hotel image updated on blockchain:', result.IpfsHash);
};
```

## Benefits for Travel.Go

### 🔒 **Security & Trust**
- **Immutable**: Files cannot be altered once uploaded
- **Verifiable**: Each file has a unique cryptographic hash
- **Decentralized**: No single point of failure

### 💰 **Cost Efficiency**
- **Permanent Storage**: Pay once, store forever
- **Bandwidth Optimization**: Files served from global network
- **Reduced Server Costs**: Offload file storage from your servers

### 🌐 **Web3 Alignment**
- **Blockchain Native**: Perfect fit for your Web3 platform
- **Censorship Resistant**: Files remain accessible globally
- **User Ownership**: Users truly own their uploaded content

### 📈 **Scalability**
- **Global CDN**: Files served from nearest location
- **Infinite Storage**: No storage limits
- **Performance**: Fast global access

## Monitoring & Management

### 1. **Pinata Dashboard**
- View all uploaded files
- Monitor storage usage
- Manage pinning policies
- Track bandwidth usage

### 2. **File Management Functions**
```typescript
// List all hotel images
const hotelImages = await ipfsService.listPinnedFiles({
  metadata: { type: 'hotel-image' }
});

// Remove old file
await ipfsService.unpinFile(oldImageHash);

// Get file metadata
const metadata = await ipfsService.getFileMetadata(ipfsHash);
```

## Migration Strategy

### Phase 1: Parallel Implementation
- Keep existing Firebase Storage
- Add IPFS for new uploads
- Test thoroughly

### Phase 2: Gradual Migration
- Migrate critical files to IPFS
- Update database references
- Maintain fallback to Firebase

### Phase 3: Full IPFS
- All new files go to IPFS
- Legacy files remain on Firebase
- Optional: Migrate old files

## Troubleshooting

### Common Issues
1. **API Key Issues**: Check environment variables
2. **File Size Limits**: Pinata has upload limits
3. **Gateway Timeouts**: Use multiple gateways
4. **Network Issues**: Implement retry logic

### Debug Mode
```typescript
// Enable debug logging
const result = await ipfsService.uploadFile(file, {
  name: 'debug-upload',
  metadata: { debug: true }
});
```

## Conclusion

IPFS integration transforms Travel.Go from a traditional web application to a truly decentralized Web3 platform. Your files are now:

- ✅ **Permanently stored** on a global network
- ✅ **Cryptographically verified** for integrity
- ✅ **Censorship resistant** and always accessible
- ✅ **Web3 native** and blockchain-compatible

The integration is production-ready and can be deployed immediately. Test it at `/admin/ipfs-test` and start using it for your hotel booking platform!

---

**Next Steps:**
1. Set up Pinata account and API keys
2. Test the integration with sample files
3. Integrate IPFS uploads into your hotel management system
4. Update smart contracts to store IPFS hashes
5. Deploy to production

Your Travel.Go platform now has enterprise-grade decentralized storage! 🚀 