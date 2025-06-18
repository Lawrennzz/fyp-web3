const { ethers, network } = require("hardhat");
require("dotenv").config();

async function main() {
  const networkName = network.name;
  console.log(`Deploying HotelBooking contract to ${networkName}...`);

  // Get the contract factory
  const HotelBooking = await ethers.getContractFactory("HotelBooking");
  
  // Deploy the contract
  console.log("Deploying contract...");
  const hotelBooking = await HotelBooking.deploy();
  
  // Wait for the contract to be deployed
  await hotelBooking.waitForDeployment();
  
  // Get the contract address
  const hotelBookingAddress = await hotelBooking.getAddress();
  
  console.log(`HotelBooking contract deployed to: ${hotelBookingAddress} on ${networkName}`);
  console.log("Contract deployment completed successfully!");
  
  // Add verification command information
  console.log("\nVerify with:");
  console.log(`npx hardhat verify --network ${networkName} ${hotelBookingAddress}`);
  
  // Save the contract address to a file
  const fs = require("fs");
  const deploymentInfo = {
    network: networkName,
    contractAddress: hotelBookingAddress,
    deploymentTime: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    `deployment-${networkName}.json`, 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log(`\nDeployment info saved to deployment-${networkName}.json`);
}

// Execute the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 