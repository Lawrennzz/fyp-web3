const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Get the first signer (account)
  const [signer] = await ethers.getSigners();
  const userAddress = await signer.getAddress();
  const amount = ethers.parseUnits("10000", 18); // 10,000 USDT

  // Read USDT address from deployment file
  const usdtDeploymentPath = path.join(__dirname, "..", "test-usdt-deployment.json");
  const usdtDeployment = JSON.parse(fs.readFileSync(usdtDeploymentPath, "utf8"));
  const usdtAddress = usdtDeployment.tokenAddress;

  console.log(`Minting ${ethers.formatUnits(amount, 18)} USDT to ${userAddress}`);

  // Get the TestUSDT contract
  const TestUSDT = await ethers.getContractFactory("TestUSDT");
  const usdt = TestUSDT.attach(usdtAddress);

  // Mint USDT
  const tx = await usdt.mint(userAddress, amount);
  await tx.wait();

  console.log("USDT minted successfully!");

  // Check balance
  const balance = await usdt.balanceOf(userAddress);
  console.log(`New balance: ${ethers.formatUnits(balance, 18)} USDT`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 