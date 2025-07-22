// scripts/fetchEvents.js
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load ABI and config
const abi = require("../frontend/src/contracts/HotelBooking.json").abi;
const CONTRACT_ADDRESS = "0x9D088f095e7a7AC0618230b9D150fD0Cd0Ebc943"; // Update if needed
const RPC_URL = "http://127.0.0.1:7545"; // Ganache

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

    const events = await contract.queryFilter(contract.filters.BookingCreated(), 0, "latest");
    console.log("BookingCreated events:", events.length);
    for (const event of events) {
        console.log(event.args);
    }
}

main().catch(console.error); 