const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying Test USDT token...");

    // Deploy TestUSDT
    const TestUSDT = await ethers.getContractFactory("TestUSDT");
    const testUSDT = await TestUSDT.deploy();
    await testUSDT.waitForDeployment();

    const testUSDTAddress = await testUSDT.getAddress();
    console.log(`Test USDT deployed to: ${testUSDTAddress}`);

    // Save the address to a file
    const fs = require("fs");
    const deploymentInfo = {
        network: "localhost",
        tokenAddress: testUSDTAddress,
        deploymentTime: new Date().toISOString(),
    };

    fs.writeFileSync(
        "test-usdt-deployment.json",
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("Test USDT deployment info saved to test-usdt-deployment.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 