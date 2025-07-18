const TestUSDT = artifacts.require("TestUSDT");
const HotelBooking = artifacts.require("HotelBooking");

module.exports = async function (deployer) {
    await deployer.deploy(TestUSDT);
    const usdt = await TestUSDT.deployed();
    await deployer.deploy(HotelBooking, usdt.address); // Pass USDT address to HotelBooking constructor
}; 