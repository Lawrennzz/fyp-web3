const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying HotelBooking contract...");
  console.log(`Network: ${network.name}`);

  // Read USDT address from deployment file
  const usdtDeploymentPath = path.join(__dirname, "..", "test-usdt-deployment.json");
  const usdtDeployment = JSON.parse(fs.readFileSync(usdtDeploymentPath, "utf8"));
  const usdtAddress = usdtDeployment.tokenAddress;

  console.log(`Using USDT address: ${usdtAddress}`);

  // Get the contract factory
  const HotelBooking = await ethers.getContractFactory("HotelBooking");
  
  // Deploy the contract with USDT address
  const hotelBooking = await HotelBooking.deploy(usdtAddress);
  
  // Wait for the contract to be deployed
  await hotelBooking.waitForDeployment();
  
  // Get the contract address
  const hotelBookingAddress = await hotelBooking.getAddress();
  
  console.log(`HotelBooking contract deployed to: ${hotelBookingAddress}`);
  
  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    hotelBookingAddress,
    usdtAddress,
    deploymentTime: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(__dirname, "..", "deployment.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment info saved to deployment.json");
  
  // For demo purposes, add a sample hotel and room
  if (network.name === "hardhat" || network.name === "localhost") {
    console.log("\nAdding a sample hotel...");
    
    const txHotel = await hotelBooking.addHotel(
      "The Ritz-Carlton",
      "150 Piccadilly, St. James's, London, United Kingdom",
      "Experience luxury and elegance in the heart of London",
      "https://images.unsplash.com/photo-1566073771259-6a8506099945"
    );
    
    await txHotel.wait();
    console.log("Sample hotel added!");
    
    console.log("\nAdding a sample room...");
    
    const txRoom = await hotelBooking.addRoom(
      "1", // Hotel ID
      "Deluxe Room", 
      ethers.parseUnits("500", 18), // 500 USDT per night
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