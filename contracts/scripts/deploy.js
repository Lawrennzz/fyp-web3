const { ethers, network } = require("hardhat");

async function main() {
  console.log("Deploying HotelBooking contract...");
  console.log(`Network: ${network.name}`);

  // Get the contract factory
  const HotelBooking = await ethers.getContractFactory("HotelBooking");
  
  // Deploy the contract
  const hotelBooking = await HotelBooking.deploy();
  
  // Wait for the contract to be deployed
  await hotelBooking.waitForDeployment();
  
  // Get the contract address
  const hotelBookingAddress = await hotelBooking.getAddress();
  
  console.log(`HotelBooking contract deployed to: ${hotelBookingAddress}`);
  
  // Add verification command information
  console.log("\nVerify with:");
  console.log(`npx hardhat verify --network ${network.name} ${hotelBookingAddress}`);
  
  // For demo purposes, add a sample hotel and room
  if (network.name === "hardhat" || network.name === "localhost") {
    console.log("\nAdding a sample hotel...");
    
    const txHotel = await hotelBooking.addHotel(
      "Blockchain Resort",
      "Crypto City, Metaverse",
      "A luxurious blockchain-themed resort with NFT artwork in every room",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945"
    );
    
    await txHotel.wait();
    console.log("Sample hotel added!");
    
    console.log("\nAdding a sample room...");
    
    // Hotel ID is 1 (first hotel)
    const txRoom = await hotelBooking.addRoom(
      1, // Hotel ID
      "Deluxe King Room", 
      ethers.parseEther("0.05"), // 0.05 ETH per night
      2 // Max 2 guests
    );
    
    await txRoom.wait();
    console.log("Sample room added!");
  }
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 