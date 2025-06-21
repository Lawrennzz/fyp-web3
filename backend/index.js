const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const config = require('./config');
const hotelRoutes = require('./routes/hotels');
const healthRouter = require('./routes/health');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors(config.corsOptions));

// Routes
app.use('/api/hotels', hotelRoutes);
app.use('/api/health', healthRouter);

// Connect to MongoDB with detailed error logging
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000 // 5 second timeout
})
.then(() => {
  console.log('Connected to MongoDB successfully');
  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack
  });
  process.exit(1);
});

// Error handling middleware with detailed error information
app.use((err, req, res, next) => {
  console.error('Error details:', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack,
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body
  });
  
  res.status(500).json({
    message: 'Something went wrong!',
    error: {
      name: err.name,
      message: err.message,
      code: err.code
    }
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', {
    name: err.name,
    message: err.message,
    code: err.code,
    stack: err.stack
  });
  // Don't exit the process, just log the error
  // process.exit(1);
});

module.exports = app; 