const Queue = require('queue');
const config = require('../config');
const invoiceGenerator = require('../utils/invoiceGenerator');
const notificationService = require('../utils/notificationService');
const HotelBooking = require('../models/Hotel');

class PaymentService {
  constructor() {
    // Initialize transaction queue for concurrent processing
    this.transactionQueue = new Queue({
      concurrency: config.payment.maxConcurrentTransactions,
      timeout: 30000 // 30 seconds timeout
    });

    // Start processing the queue
    this.transactionQueue.start();
  }

  // Process payment with any payment method
  async processPayment(bookingData, paymentMethod) {
    return new Promise((resolve, reject) => {
      this.transactionQueue.push(async () => {
        try {
          // Validate payment method
          if (!config.payment.supportedMethods.includes(paymentMethod)) {
            throw new Error('Unsupported payment method');
          }

          // Calculate total amount with processing fee
          const processingFee = bookingData.totalAmount * config.payment.processingFee;
          const finalAmount = bookingData.totalAmount + processingFee;

          // Process payment based on method
          let paymentResult;
          switch (paymentMethod) {
            case 'crypto':
              paymentResult = await this.processCryptoPayment(bookingData, finalAmount);
              break;
            case 'card':
              paymentResult = await this.processCardPayment(bookingData, finalAmount);
              break;
            case 'bank':
              paymentResult = await this.processBankPayment(bookingData, finalAmount);
              break;
            default:
              throw new Error('Invalid payment method');
          }

          if (paymentResult.success) {
            // Generate invoice
            const invoiceResult = await invoiceGenerator.generateInvoice({
              ...bookingData,
              paymentMethod,
              transactionHash: paymentResult.transactionHash
            });

            // Send success notification
            await notificationService.sendPaymentSuccess({
              ...bookingData,
              invoiceNumber: invoiceResult.invoiceNumber
            });

            resolve({
              success: true,
              paymentId: paymentResult.paymentId,
              invoiceNumber: invoiceResult.invoiceNumber,
              transactionHash: paymentResult.transactionHash
            });
          } else {
            throw new Error(paymentResult.error || 'Payment failed');
          }
        } catch (error) {
          // Send failure notification
          await notificationService.sendPaymentFailure(bookingData, error);
          reject(error);
        }
      });
    });
  }

  // Process crypto payment using smart contract
  async processCryptoPayment(bookingData, amount) {
    try {
      // Implementation will use the HotelBooking smart contract
      // This is a placeholder for the actual implementation
      return {
        success: true,
        paymentId: 'crypto_' + Date.now(),
        transactionHash: '0x...' // Will be actual transaction hash
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process card payment
  async processCardPayment(bookingData, amount) {
    try {
      // Implementation will integrate with a payment gateway
      // This is a placeholder for the actual implementation
      return {
        success: true,
        paymentId: 'card_' + Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process bank transfer
  async processBankPayment(bookingData, amount) {
    try {
      // Implementation will integrate with banking APIs
      // This is a placeholder for the actual implementation
      return {
        success: true,
        paymentId: 'bank_' + Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process refund
  async processRefund(bookingData) {
    return new Promise((resolve, reject) => {
      this.transactionQueue.push(async () => {
        try {
          // Check if refund is within allowed window
          const bookingTime = new Date(bookingData.createdAt).getTime();
          const currentTime = Date.now();
          
          if (currentTime - bookingTime > config.payment.refundWindow) {
            throw new Error('Refund window has expired');
          }

          // Process refund based on original payment method
          let refundResult;
          switch (bookingData.paymentMethod) {
            case 'crypto':
              refundResult = await this.processCryptoRefund(bookingData);
              break;
            case 'card':
              refundResult = await this.processCardRefund(bookingData);
              break;
            case 'bank':
              refundResult = await this.processBankRefund(bookingData);
              break;
            default:
              throw new Error('Invalid payment method for refund');
          }

          if (refundResult.success) {
            // Send refund notification
            await notificationService.sendRefundNotification({
              ...bookingData,
              refundAmount: refundResult.amount
            });

            resolve({
              success: true,
              refundId: refundResult.refundId,
              amount: refundResult.amount
            });
          } else {
            throw new Error(refundResult.error || 'Refund failed');
          }
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // Helper methods for refunds
  async processCryptoRefund(bookingData) {
    // Implementation will use the smart contract's refund function
    return {
      success: true,
      refundId: 'refund_crypto_' + Date.now(),
      amount: bookingData.totalAmount
    };
  }

  async processCardRefund(bookingData) {
    // Implementation will use payment gateway's refund API
    return {
      success: true,
      refundId: 'refund_card_' + Date.now(),
      amount: bookingData.totalAmount
    };
  }

  async processBankRefund(bookingData) {
    // Implementation will use banking API's refund function
    return {
      success: true,
      refundId: 'refund_bank_' + Date.now(),
      amount: bookingData.totalAmount
    };
  }
}

module.exports = new PaymentService(); 