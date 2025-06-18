const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config');
const hotelRoutes = require('./routes/hotels');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Query:`, req.query);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    status: 'OK',
    timestamp: Date.now(),
    mongoConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.json(healthcheck);
});

// Debug middleware to log all registered routes
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log('Route:', r.route.path);
    console.log('Methods:', Object.keys(r.route.methods));
  }
});

// Routes
app.use('/api/hotels', hotelRoutes);

// Debug middleware to log all registered routes after mounting
app._router.stack.forEach(function(r){
  if (r.route && r.route.path){
    console.log('Route after mounting:', r.route.path);
    console.log('Methods:', Object.keys(r.route.methods));
  }
});

// Connect to MongoDB
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  
  // Start server only after successful DB connection
  const PORT = config.port || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API base URL: http://localhost:${PORT}/api`);
    console.log('Available routes:');
    console.log('- GET /api/health');
    console.log('- GET /api/hotels');
    console.log('- GET /api/hotels/facilities/count');
    console.log('- GET /api/hotels/:id');

    // Log all registered routes one final time
    console.log('\nAll registered routes:');
    app._router.stack.forEach(function(r){
      if (r.route && r.route.path){
        console.log(`${Object.keys(r.route.methods).join(',')} ${r.route.path}`);
      }
    });
  });
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
  process.exit(1);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

module.exports = app; 