const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const config = require('./config');
const hotelRoutes = require('./routes/hotels');
const healthRouter = require('./routes/health');
const adminRouter = require('./routes/admin');
const ownerRouter = require('./routes/owner');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
try {
  const serviceAccountPath = path.join(__dirname, 'firebase-admin-key.json');

  if (fs.existsSync(serviceAccountPath)) {
    // Use service account file if available
    const serviceAccount = require('./firebase-admin-key.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized with service account file');
  } else if (process.env.FIREBASE_ADMIN_CREDENTIALS) {
    // Use environment variable if available
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIALS);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin initialized with environment credentials');
  } else {
    // Use default credentials (for Google Cloud)
    admin.initializeApp();
    console.log('Firebase Admin initialized with default credentials');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

const app = express();

// Middleware
app.use(express.json());
app.use(cors(config.corsOptions));

// Routes
app.use('/api/hotels', hotelRoutes);
app.use('/api/health', healthRouter);
app.use('/api/admin', adminRouter);
app.use('/api/owner', ownerRouter);

// Function to print all registered routes
const printRoutes = (app) => {
  console.log('\n=== REGISTERED API ROUTES ===');
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      const methods = Object.keys(middleware.route.methods)
        .filter(method => middleware.route.methods[method])
        .join(', ').toUpperCase();
      console.log(`${methods} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods)
            .filter(method => handler.route.methods[method])
            .join(', ').toUpperCase();
          const routePath = handler.route.path;
          const basePath = middleware.regexp.toString().split('\\')[1];
          console.log(`${methods} /${basePath}${routePath}`);
        }
      });
    }
  });
  console.log('==============================\n');
};

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
      printRoutes(app);
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