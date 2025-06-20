// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title HotelBooking
 * @dev Smart contract for a decentralized hotel booking platform
 */
contract HotelBooking is Ownable, ReentrancyGuard {
    IERC20 public paymentToken;
    
    struct Booking {
        address guest;
        uint256 amount;
        uint256 timestamp;
        bool isRefunded;
        string hotelId;
        string roomId;
        uint256 checkIn;
        uint256 checkOut;
    }
    
    // Stats for admin dashboard
    uint256 public totalTransactions;
    uint256 public totalRevenue;
    uint256 public pendingRefunds;
    uint256 public failedTransactions;
    
    mapping(string => Booking) public bookings;
    mapping(address => string[]) public guestBookings;
    mapping(string => mapping(uint256 => bool)) public roomAvailability;
    
    event BookingCreated(
        string bookingId,
        address guest,
        uint256 amount,
        uint256 timestamp,
        string hotelId,
        string roomId
    );
    
    event RefundProcessed(
        string bookingId,
        address guest,
        uint256 amount,
        uint256 timestamp
    );
    
    event TransactionFailed(
        address guest,
        uint256 amount,
        uint256 timestamp,
        string reason
    );

    constructor(address _paymentToken) {
        paymentToken = IERC20(_paymentToken);
    }
    
    function book(
        string memory bookingId,
        string memory hotelId,
        string memory roomId,
        uint256 amount,
        uint256 checkIn,
        uint256 checkOut
    ) external nonReentrant {
        require(bytes(bookingId).length > 0, "Invalid booking ID");
        require(amount > 0, "Invalid amount");
        require(checkIn < checkOut, "Invalid dates");
        require(bookings[bookingId].timestamp == 0, "Booking ID already exists");
        
        // Check room availability
        for (uint256 date = checkIn; date < checkOut; date += 1 days) {
            require(!roomAvailability[roomId][date], "Room not available for selected dates");
            roomAvailability[roomId][date] = true;
        }
        
        // Transfer payment
        bool success = paymentToken.transferFrom(msg.sender, address(this), amount);
        require(success, "Payment failed");
        
        // Create booking
        bookings[bookingId] = Booking({
            guest: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            isRefunded: false,
            hotelId: hotelId,
            roomId: roomId,
            checkIn: checkIn,
            checkOut: checkOut
        });
        
        guestBookings[msg.sender].push(bookingId);
        
        // Update stats
        totalTransactions++;
        totalRevenue += amount;
        
        emit BookingCreated(
            bookingId,
            msg.sender,
            amount,
            block.timestamp,
            hotelId,
            roomId
        );
    }
    
    function processRefund(string memory bookingId) external onlyOwner nonReentrant {
        Booking storage booking = bookings[bookingId];
        require(booking.timestamp > 0, "Booking not found");
        require(!booking.isRefunded, "Already refunded");
        
        // Process refund
        bool success = paymentToken.transfer(booking.guest, booking.amount);
        require(success, "Refund transfer failed");
        
        booking.isRefunded = true;
        
        // Free up room availability
        for (uint256 date = booking.checkIn; date < booking.checkOut; date += 1 days) {
            roomAvailability[booking.roomId][date] = false;
        }
        
        // Update stats
        totalRevenue -= booking.amount;
        pendingRefunds--;
        
        emit RefundProcessed(
            bookingId,
            booking.guest,
            booking.amount,
            block.timestamp
        );
    }
    
    // Admin dashboard functions
    function getTotalTransactions() external view returns (uint256) {
        return totalTransactions;
    }
    
    function getTotalRevenue() external view returns (uint256) {
        return totalRevenue;
    }
    
    function getPendingRefunds() external view returns (uint256) {
        return pendingRefunds;
    }
    
    function getFailedTransactions() external view returns (uint256) {
        return failedTransactions;
    }
    
    function getBookingDetails(string memory bookingId) external view returns (
        address guest,
        uint256 amount,
        uint256 timestamp,
        bool isRefunded,
        string memory hotelId,
        string memory roomId,
        uint256 checkIn,
        uint256 checkOut
    ) {
        Booking memory booking = bookings[bookingId];
        return (
            booking.guest,
            booking.amount,
            booking.timestamp,
            booking.isRefunded,
            booking.hotelId,
            booking.roomId,
            booking.checkIn,
            booking.checkOut
        );
    }
    
    function getGuestBookings(address guest) external view returns (string[] memory) {
        return guestBookings[guest];
    }
    
    // Function to handle failed transactions
    function recordFailedTransaction(address guest, uint256 amount, string memory reason) external onlyOwner {
        failedTransactions++;
        emit TransactionFailed(guest, amount, block.timestamp, reason);
    }
    
    // Emergency functions
    function withdrawTokens(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
    }
    
    function updatePaymentToken(address newToken) external onlyOwner {
        require(newToken != address(0), "Invalid token address");
        paymentToken = IERC20(newToken);
    }
} 