const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Make sure to create a .env-local file if it doesn't exist
const envLocalPath = path.join(__dirname, '..', '.env-local');
if (!fs.existsSync(envLocalPath)) {
  console.log('Creating .env-local file...');
  fs.writeFileSync(
    envLocalPath,
    `HARDHAT_NETWORK=localhost
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
`
  );
}

console.log('Starting local Hardhat node...');
console.log('This will run in the foreground. Press Ctrl+C to stop.');
console.log('\nOnce the node is running, open a new terminal and run:');
console.log('npx hardhat run scripts/deploy.js --network localhost');
console.log('\n----- Local Blockchain -----');

try {
  // Run the Hardhat node with 10 accounts, each with 1000 ETH
  execSync(
    'npx hardhat node --hostname 0.0.0.0',
    { stdio: 'inherit' }
  );
} catch (error) {
  console.error('Error starting local node:', error.message);
  process.exit(1);
} 