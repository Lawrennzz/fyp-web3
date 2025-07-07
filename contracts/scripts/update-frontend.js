const fs = require('fs');
const path = require('path');

// Define paths
const hotelBookingArtifactPath = path.join(__dirname, '../artifacts/contracts/HotelBooking.sol/HotelBooking.json');
const testUSDTArtifactPath = path.join(__dirname, '../artifacts/contracts/TestUSDT.sol/TestUSDT.json');
const frontendContractsDir = path.join(__dirname, '../../frontend/src/contracts');

// Ensure the frontend contracts directory exists
if (!fs.existsSync(frontendContractsDir)) {
  fs.mkdirSync(frontendContractsDir, { recursive: true });
}

// Read deployment addresses
const deploymentPath = path.join(__dirname, '../deployment.json');
let deployment = {};
if (fs.existsSync(deploymentPath)) {
  deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
}

// Copy HotelBooking contract
if (fs.existsSync(hotelBookingArtifactPath)) {
  const hotelBookingArtifact = JSON.parse(fs.readFileSync(hotelBookingArtifactPath, 'utf8'));
  fs.writeFileSync(
    path.join(frontendContractsDir, 'HotelBooking.json'),
    JSON.stringify(hotelBookingArtifact, null, 2)
  );
  console.log('✅ HotelBooking contract ABI updated');
} else {
  console.error('❌ HotelBooking artifact not found');
}

// Copy TestUSDT contract
if (fs.existsSync(testUSDTArtifactPath)) {
  const testUSDTArtifact = JSON.parse(fs.readFileSync(testUSDTArtifactPath, 'utf8'));
  fs.writeFileSync(
    path.join(frontendContractsDir, 'TestUSDT.json'),
    JSON.stringify(testUSDTArtifact, null, 2)
  );
  console.log('✅ TestUSDT contract ABI updated');
} else {
  console.error('❌ TestUSDT artifact not found');
}

// Update config file with contract addresses
const configPath = path.join(__dirname, '../../frontend/src/config/index.ts');
if (fs.existsSync(configPath) && deployment.hotelBookingAddress && deployment.usdtAddress) {
  let configContent = fs.readFileSync(configPath, 'utf8');

  // Update contract addresses
  configContent = configContent.replace(
    /HOTEL_BOOKING_CONTRACT: ['"`].*['"`]/,
    `HOTEL_BOOKING_CONTRACT: '${deployment.hotelBookingAddress}'`
  );

  configContent = configContent.replace(
    /USDT_CONTRACT: ['"`].*['"`]/,
    `USDT_CONTRACT: '${deployment.usdtAddress}'`
  );

  fs.writeFileSync(configPath, configContent);
  console.log('✅ Frontend config updated with contract addresses');
} else {
  console.error('❌ Could not update frontend config (file not found or missing addresses)');
}

console.log('Frontend contract files update completed'); 