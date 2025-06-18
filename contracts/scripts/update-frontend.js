const fs = require('fs');
const path = require('path');

async function main() {
  const network = process.argv[2]; // Get network from command line
  
  if (!network) {
    console.error('Please specify a network (sepolia, mumbai, or localhost)');
    process.exit(1);
  }
  
  // Read deployment info
  const deploymentFile = `deployment-${network}.json`;
  
  if (!fs.existsSync(deploymentFile)) {
    console.error(`Deployment file ${deploymentFile} not found. Please deploy to ${network} first.`);
    process.exit(1);
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
  const contractAddress = deploymentInfo.contractAddress;
  
  console.log(`Updating frontend with contract address: ${contractAddress} (${network})`);
  
  // Path to the frontend contract utility file
  const frontendPath = path.join(__dirname, '../../frontend/src/utils/HotelBookingContract.js');
  
  // Read the file
  let contractJs = fs.readFileSync(frontendPath, 'utf8');
  
  // Update the address in the file
  const addressRegex = new RegExp(`${network}:\\s*"0x[0-9a-fA-F]{0,40}"`, 'g');
  const replacement = `${network}: "${contractAddress}"`;
  
  contractJs = contractJs.replace(addressRegex, replacement);
  
  // Write the updated file
  fs.writeFileSync(frontendPath, contractJs);
  
  console.log(`Frontend updated successfully!`);
  console.log(`Contract address for ${network} set to ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  }); 