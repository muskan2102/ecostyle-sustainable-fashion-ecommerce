const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const paypalRoutes = require('./routes/paypal');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://via.placeholder.com", "https://picsum.photos"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client')));

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ecostyle', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// API Routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/paypal', paypalRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'EcoStyle API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend routes - handle client-side routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/products', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/products.html'));
});

app.get('/products/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/product-details.html'));
});

app.get('/add-product', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/add-product.html'));
});

app.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/cart.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/checkout.html'));
});

app.get('/payment/success', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/payment-success.html'));
});

app.get('/payment/cancel', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/payment-cancel.html'));
});

app.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/orders.html'));
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// 404 handler for client routes
app.use('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../client/404.html'));
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Global error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(error.errors).map(err => err.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format'
    });
  }
  
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 EcoStyle server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 Client served at: http://localhost:${PORT}`);
});

module.exports = app;
