# Travel.Go Smart Contracts

This directory contains the smart contracts for the Travel.Go Web3 hotel booking platform.

## HotelBooking.sol

The main smart contract that handles hotel listings, room management, and bookings on the blockchain.

### Key Features

- Hotel owners can register their hotels and rooms
- Guests can browse available rooms and make bookings
- Payments are processed directly on the blockchain
- Bookings are secured by smart contracts
- Cancellation policies are enforced on-chain

## Development Setup

### Prerequisites

- Node.js and npm installed
- Hardhat for smart contract development
- MetaMask or another Web3 wallet

### Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   PRIVATE_KEY=your_private_key
   SEPOLIA_RPC_URL=your_sepolia_rpc_url
   POLYGON_MUMBAI_RPC_URL=your_mumbai_rpc_url
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

### Compile Contracts

```
npx hardhat compile
```

### Run Tests

```
npx hardhat test
```

### Deploy to Local Network

Start a local Hardhat node:
```
npx hardhat node
```

Deploy to the local network:
```
npx hardhat run scripts/deploy.js --network localhost
```

### Deploy to Test Network

Deploy to Sepolia:
```
npx hardhat run scripts/deploy.js --network sepolia
```

Deploy to Polygon Mumbai:
```
npx hardhat run scripts/deploy.js --network mumbai
```

## Contract Interaction

### Add a Hotel

```javascript
const hotelBooking = await ethers.getContractAt("HotelBooking", "CONTRACT_ADDRESS");
const tx = await hotelBooking.addHotel(
  "Hotel Name",
  "Hotel Location",
  "Hotel Description",
  "Image URL"
);
await tx.wait();
```

### Add a Room

```javascript
const tx = await hotelBooking.addRoom(
  hotelId,            // Hotel ID
  "Room Type",        // E.g., "Deluxe King"
  ethers.parseEther("0.05"),  // Price per night (0.05 ETH)
  2                   // Capacity (2 guests)
);
await tx.wait();
```

### Create a Booking

```javascript
// Convert dates to Unix timestamps
const checkInDate = Math.floor(new Date("2023-12-25").getTime() / 1000);
const checkOutDate = Math.floor(new Date("2023-12-27").getTime() / 1000);

const tx = await hotelBooking.createBooking(
  hotelId,
  roomId,
  checkInDate,
  checkOutDate
);
await tx.wait();
```

### Pay for a Booking

```javascript
const booking = await hotelBooking.bookings(bookingId);
const tx = await hotelBooking.payForBooking(bookingId, {
  value: booking.totalPrice
});
await tx.wait();
```

## Integration with Frontend

The smart contract is designed to work with the Travel.Go frontend. The frontend interacts with the contract through a Web3 provider, allowing users to:

1. Browse hotels and rooms
2. Make bookings using cryptocurrency
3. View their booking history
4. Cancel bookings if needed

## Contract Address

Once deployed, the contract address will be printed in the console and should be used in the frontend configuration.
