// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HotelBooking
 * @dev Smart contract for a decentralized hotel booking platform
 */
contract HotelBooking is ReentrancyGuard, Ownable {
    // Counter for booking IDs
    uint256 private bookingIdCounter;
    
    // Counter for hotel IDs
    uint256 private hotelIdCounter;
    
    // Struct to store hotel details
    struct Hotel {
        uint256 id;
        address hotelOwner;
        string name;
        string location;
        string description;
        string imageUrl;
        bool isActive;
    }
    
    // Struct to store room details
    struct Room {
        uint256 id;
        uint256 hotelId;
        string roomType;
        uint256 price;
        uint256 capacity;
        bool isAvailable;
    }
    
    // Struct to store booking details
    struct Booking {
        uint256 id;
        uint256 hotelId;
        uint256 roomId;
        address guest;
        uint256 checkInDate;
        uint256 checkOutDate;
        uint256 totalPrice;
        bool isPaid;
        bool isCancelled;
    }
    
    // Mapping hotelId => Hotel
    mapping(uint256 => Hotel) public hotels;
    
    // Mapping roomId => Room
    mapping(uint256 => Room) public rooms;
    
    // Mapping bookingId => Booking
    mapping(uint256 => Booking) public bookings;
    
    // Mapping hotelId => roomIds
    mapping(uint256 => uint256[]) public hotelRooms;
    
    // Mapping guest address => bookingIds
    mapping(address => uint256[]) public guestBookings;
    
    // Events
    event HotelAdded(uint256 hotelId, string name, address hotelOwner);
    event RoomAdded(uint256 roomId, uint256 hotelId, string roomType, uint256 price);
    event BookingCreated(uint256 bookingId, uint256 hotelId, uint256 roomId, address guest, uint256 checkInDate, uint256 checkOutDate);
    event BookingPaid(uint256 bookingId, address guest, uint256 amount);
    event BookingCancelled(uint256 bookingId);
    
    // Modifiers
    modifier onlyHotelOwner(uint256 _hotelId) {
        require(msg.sender == hotels[_hotelId].hotelOwner, "Only hotel owner can call this function");
        _;
    }
    
    modifier onlyGuest(uint256 _bookingId) {
        require(msg.sender == bookings[_bookingId].guest, "Only booking guest can call this function");
        _;
    }
    
    // Constructor
    constructor() {
        bookingIdCounter = 1;
        hotelIdCounter = 1;
    }
    
    /**
     * @dev Add a new hotel
     * @param _name Hotel name
     * @param _location Hotel location
     * @param _description Hotel description
     * @param _imageUrl Hotel image URL
     * @return id of the new hotel
     */
    function addHotel(string memory _name, string memory _location, string memory _description, string memory _imageUrl) 
        public 
        returns (uint256) 
    {
        uint256 hotelId = hotelIdCounter++;
        
        hotels[hotelId] = Hotel({
            id: hotelId,
            hotelOwner: msg.sender,
            name: _name,
            location: _location,
            description: _description,
            imageUrl: _imageUrl,
            isActive: true
        });
        
        emit HotelAdded(hotelId, _name, msg.sender);
        
        return hotelId;
    }
    
    /**
     * @dev Add a new room to a hotel
     * @param _hotelId Hotel ID
     * @param _roomType Type of room
     * @param _price Price per night in wei
     * @param _capacity Maximum number of guests
     * @return id of the new room
     */
    function addRoom(uint256 _hotelId, string memory _roomType, uint256 _price, uint256 _capacity) 
        public 
        onlyHotelOwner(_hotelId)
        returns (uint256) 
    {
        require(hotels[_hotelId].isActive, "Hotel is not active");
        
        uint256 roomId = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, _hotelId, _roomType)));
        
        rooms[roomId] = Room({
            id: roomId,
            hotelId: _hotelId,
            roomType: _roomType,
            price: _price,
            capacity: _capacity,
            isAvailable: true
        });
        
        hotelRooms[_hotelId].push(roomId);
        
        emit RoomAdded(roomId, _hotelId, _roomType, _price);
        
        return roomId;
    }
    
    /**
     * @dev Create a new booking
     * @param _hotelId Hotel ID
     * @param _roomId Room ID
     * @param _checkInDate Check-in date (Unix timestamp)
     * @param _checkOutDate Check-out date (Unix timestamp)
     * @return id of the new booking
     */
    function createBooking(uint256 _hotelId, uint256 _roomId, uint256 _checkInDate, uint256 _checkOutDate) 
        public 
        returns (uint256) 
    {
        require(hotels[_hotelId].isActive, "Hotel is not active");
        require(rooms[_roomId].isAvailable, "Room is not available");
        require(_checkInDate < _checkOutDate, "Check-out date must be after check-in date");
        require(_checkInDate > block.timestamp, "Check-in date must be in the future");
        
        // Calculate number of nights
        uint256 numberOfNights = (_checkOutDate - _checkInDate) / 86400; // 86400 seconds = 1 day
        require(numberOfNights > 0, "Booking must be for at least one night");
        
        // Calculate total price
        uint256 totalPrice = rooms[_roomId].price * numberOfNights;
        
        uint256 bookingId = bookingIdCounter++;
        
        bookings[bookingId] = Booking({
            id: bookingId,
            hotelId: _hotelId,
            roomId: _roomId,
            guest: msg.sender,
            checkInDate: _checkInDate,
            checkOutDate: _checkOutDate,
            totalPrice: totalPrice,
            isPaid: false,
            isCancelled: false
        });
        
        // Add booking to guest's bookings
        guestBookings[msg.sender].push(bookingId);
        
        // Mark room as unavailable
        rooms[_roomId].isAvailable = false;
        
        emit BookingCreated(bookingId, _hotelId, _roomId, msg.sender, _checkInDate, _checkOutDate);
        
        return bookingId;
    }
    
    /**
     * @dev Pay for a booking
     * @param _bookingId Booking ID
     */
    function payBooking(uint256 _bookingId) 
        public 
        payable 
        onlyGuest(_bookingId)
        nonReentrant 
    {
        Booking storage booking = bookings[_bookingId];
        require(!booking.isPaid, "Booking is already paid");
        require(!booking.isCancelled, "Booking is cancelled");
        require(msg.value == booking.totalPrice, "Incorrect payment amount");
        
        // Mark booking as paid
        booking.isPaid = true;
        
        // Transfer payment to hotel owner
        Hotel storage hotel = hotels[booking.hotelId];
        payable(hotel.hotelOwner).transfer(msg.value);
        
        emit BookingPaid(_bookingId, msg.sender, msg.value);
    }
    
    /**
     * @dev Cancel a booking
     * @param _bookingId Booking ID
     */
    function cancelBooking(uint256 _bookingId) 
        public 
        onlyGuest(_bookingId)
    {
        Booking storage booking = bookings[_bookingId];
        require(!booking.isCancelled, "Booking is already cancelled");
        require(!booking.isPaid, "Cannot cancel paid booking");
        require(booking.checkInDate > block.timestamp, "Cannot cancel past bookings");
        
        // Mark booking as cancelled
        booking.isCancelled = true;
        
        // Mark room as available again
        rooms[booking.roomId].isAvailable = true;
        
        emit BookingCancelled(_bookingId);
    }
    
    /**
     * @dev Get all rooms for a hotel
     * @param _hotelId Hotel ID
     * @return array of room IDs
     */
    function getHotelRooms(uint256 _hotelId) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return hotelRooms[_hotelId];
    }
    
    /**
     * @dev Get all bookings for a guest
     * @param _guest Guest address
     * @return array of booking IDs
     */
    function getGuestBookings(address _guest) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return guestBookings[_guest];
    }
} 