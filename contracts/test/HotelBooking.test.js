const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HotelBooking", function () {
  let hotelBooking;
  let owner;
  let hotelOwner;
  let guest;
  let hotelId;
  let roomId;

  // Test hotel and room data
  const hotelName = "Blockchain Resort";
  const hotelLocation = "Crypto City, Metaverse";
  const hotelDescription = "A luxurious blockchain-themed resort with NFT artwork in every room";
  const hotelImageUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945";
  
  const roomType = "Deluxe King Room";
  const roomPrice = ethers.parseEther("0.05"); // 0.05 ETH per night
  const roomCapacity = 2;
  
  // Test booking dates (in the future)
  const now = Math.floor(Date.now() / 1000);
  const checkInDate = now + 86400; // 1 day from now
  const checkOutDate = now + (3 * 86400); // 3 days from now

  beforeEach(async function () {
    // Get signers
    [owner, hotelOwner, guest] = await ethers.getSigners();
    
    // Deploy the contract
    const HotelBooking = await ethers.getContractFactory("HotelBooking");
    hotelBooking = await HotelBooking.deploy();
    
    // Add a hotel as hotelOwner
    const addHotelTx = await hotelBooking.connect(hotelOwner).addHotel(
      hotelName,
      hotelLocation,
      hotelDescription,
      hotelImageUrl
    );
    
    const receipt = await addHotelTx.wait();
    
    // Get hotel ID from event (assuming it's the first hotel, so ID = 1)
    hotelId = 1;
    
    // Add a room to the hotel
    const addRoomTx = await hotelBooking.connect(hotelOwner).addRoom(
      hotelId,
      roomType,
      roomPrice,
      roomCapacity
    );
    
    const roomReceipt = await addRoomTx.wait();
    
    // Get the room ID from the event (assuming we can access it from the receipt)
    const roomAddedEvent = roomReceipt.logs[0];
    // In a real test, we'd parse the event to get the room ID
    // For now, we'll get it by calling getHotelRooms
    const hotelRooms = await hotelBooking.getHotelRooms(hotelId);
    roomId = hotelRooms[0];
  });

  describe("Hotel Management", function () {
    it("Should add a hotel correctly", async function () {
      const hotel = await hotelBooking.hotels(hotelId);
      
      expect(hotel.name).to.equal(hotelName);
      expect(hotel.location).to.equal(hotelLocation);
      expect(hotel.description).to.equal(hotelDescription);
      expect(hotel.imageUrl).to.equal(hotelImageUrl);
      expect(hotel.hotelOwner).to.equal(hotelOwner.address);
      expect(hotel.isActive).to.be.true;
    });

    it("Should add a room to a hotel correctly", async function () {
      const room = await hotelBooking.rooms(roomId);
      
      expect(room.hotelId).to.equal(hotelId);
      expect(room.roomType).to.equal(roomType);
      expect(room.price).to.equal(roomPrice);
      expect(room.capacity).to.equal(roomCapacity);
      expect(room.isAvailable).to.be.true;
    });
  });

  describe("Booking Process", function () {
    it("Should create a booking correctly", async function () {
      // Create booking as guest
      const bookingTx = await hotelBooking.connect(guest).createBooking(
        hotelId,
        roomId,
        checkInDate,
        checkOutDate
      );
      
      await bookingTx.wait();
      
      // Check if the booking was created correctly
      const bookingId = 1; // First booking
      const booking = await hotelBooking.bookings(bookingId);
      
      expect(booking.hotelId).to.equal(hotelId);
      expect(booking.roomId).to.equal(roomId);
      expect(booking.guest).to.equal(guest.address);
      expect(booking.checkInDate).to.equal(checkInDate);
      expect(booking.checkOutDate).to.equal(checkOutDate);
      expect(booking.isPaid).to.be.false;
      expect(booking.isCancelled).to.be.false;
      
      // Check if the room is now unavailable
      const room = await hotelBooking.rooms(roomId);
      expect(room.isAvailable).to.be.false;
    });

    it("Should pay for a booking correctly", async function () {
      // Create booking as guest
      const bookingTx = await hotelBooking.connect(guest).createBooking(
        hotelId,
        roomId,
        checkInDate,
        checkOutDate
      );
      
      await bookingTx.wait();
      
      // Get booking info
      const bookingId = 1; // First booking
      const booking = await hotelBooking.bookings(bookingId);
      
      // Get hotel owner's balance before payment
      const hotelOwnerBalanceBefore = await ethers.provider.getBalance(hotelOwner.address);
      
      // Pay for the booking
      const paymentTx = await hotelBooking.connect(guest).payForBooking(bookingId, {
        value: booking.totalPrice
      });
      
      await paymentTx.wait();
      
      // Check if the booking is now paid
      const updatedBooking = await hotelBooking.bookings(bookingId);
      expect(updatedBooking.isPaid).to.be.true;
      
      // Check if the hotel owner received the payment
      const hotelOwnerBalanceAfter = await ethers.provider.getBalance(hotelOwner.address);
      expect(hotelOwnerBalanceAfter).to.be.gt(hotelOwnerBalanceBefore);
    });

    it("Should cancel a booking correctly", async function () {
      // Create booking as guest
      const bookingTx = await hotelBooking.connect(guest).createBooking(
        hotelId,
        roomId,
        checkInDate,
        checkOutDate
      );
      
      await bookingTx.wait();
      
      // Cancel the booking
      const bookingId = 1; // First booking
      const cancelTx = await hotelBooking.connect(guest).cancelBooking(bookingId);
      
      await cancelTx.wait();
      
      // Check if the booking is now cancelled
      const booking = await hotelBooking.bookings(bookingId);
      expect(booking.isCancelled).to.be.true;
      
      // Check if the room is available again
      const room = await hotelBooking.rooms(roomId);
      expect(room.isAvailable).to.be.true;
    });
  });

  describe("Edge Cases and Validations", function () {
    it("Should not allow non-hotel owners to add rooms", async function () {
      await expect(
        hotelBooking.connect(guest).addRoom(
          hotelId,
          "Unauthorized Room",
          ethers.parseEther("0.01"),
          1
        )
      ).to.be.revertedWith("Only hotel owner can call this function");
    });

    it("Should not allow booking rooms that are unavailable", async function () {
      // Create first booking
      await hotelBooking.connect(guest).createBooking(
        hotelId,
        roomId,
        checkInDate,
        checkOutDate
      );
      
      // Try to book the same room again
      await expect(
        hotelBooking.connect(guest).createBooking(
          hotelId,
          roomId,
          checkInDate,
          checkOutDate
        )
      ).to.be.revertedWith("Room is not available");
    });

    it("Should not allow check-in date to be after check-out date", async function () {
      await expect(
        hotelBooking.connect(guest).createBooking(
          hotelId,
          roomId,
          checkOutDate, // Swapped dates
          checkInDate
        )
      ).to.be.revertedWith("Check-out date must be after check-in date");
    });

    it("Should not allow non-guests to cancel bookings", async function () {
      // Create booking as guest
      await hotelBooking.connect(guest).createBooking(
        hotelId,
        roomId,
        checkInDate,
        checkOutDate
      );
      
      // Try to cancel as hotel owner (not the guest)
      const bookingId = 1;
      await expect(
        hotelBooking.connect(hotelOwner).cancelBooking(bookingId)
      ).to.be.revertedWith("Only booking guest can call this function");
    });

    it("Should handle 0 ETH test bookings correctly", async function () {
      // Add a free room to the hotel
      const freeRoomType = "Test Room";
      const freeRoomPrice = ethers.parseEther("0"); // 0 ETH
      const freeRoomCapacity = 2;
      
      const addRoomTx = await hotelBooking.connect(hotelOwner).addRoom(
        hotelId,
        freeRoomType,
        freeRoomPrice,
        freeRoomCapacity
      );
      
      const roomReceipt = await addRoomTx.wait();
      
      // Get the free room ID
      const hotelRooms = await hotelBooking.getHotelRooms(hotelId);
      const freeRoomId = hotelRooms[1]; // Second room added
      
      // Create booking for free room
      const bookingTx = await hotelBooking.connect(guest).createBooking(
        hotelId,
        freeRoomId,
        checkInDate,
        checkOutDate
      );
      
      await bookingTx.wait();
      
      // Get booking info
      const bookingId = 1;
      const booking = await hotelBooking.bookings(bookingId);
      
      // Pay 0 ETH for the booking
      const paymentTx = await hotelBooking.connect(guest).payForBooking(bookingId, {
        value: ethers.parseEther("0")
      });
      
      await paymentTx.wait();
      
      // Check if the booking is now paid
      const updatedBooking = await hotelBooking.bookings(bookingId);
      expect(updatedBooking.isPaid).to.be.true;
      expect(updatedBooking.totalPrice).to.equal(ethers.parseEther("0"));
    });
  });
}); 