const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  ecoTags: [{
    type: String
  }]
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  buyerEmail: {
    type: String,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty email for demo
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  shippingAddress: {
    street: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    zipCode: { type: String, required: false },
    country: { type: String, required: false, default: 'US' }
  },
  paymentProvider: {
    type: String,
    enum: ['paypal'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paypalOrderId: {
    type: String,
    sparse: true
  },
  paypalPaymentId: {
    type: String,
    sparse: true
  },
  orderStatus: {
    type: String,
    enum: ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'processing'
  },
  trackingNumber: {
    type: String,
    sparse: true
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ buyerEmail: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ paypalOrderId: 1 });

// Virtual for formatted total
orderSchema.virtual('formattedTotal').get(function() {
  if (this.totalAmount == null || this.totalAmount === undefined || isNaN(this.totalAmount)) {
    return '$0.00';
  }
  return `$${parseFloat(this.totalAmount).toFixed(2)}`;
});

// Virtual for item count
orderSchema.virtual('itemCount').get(function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Pre-validate middleware to generate order number before validation
orderSchema.pre('validate', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ECO-${timestamp}-${random}`;
  }
  next();
});

// Pre-save middleware to round total amount
orderSchema.pre('save', async function(next) {
  if (this.isModified('totalAmount')) {
    this.totalAmount = Math.round(this.totalAmount * 100) / 100; // Round to 2 decimal places
  }
  next();
});

// Static method to get orders by email
orderSchema.statics.findByEmail = function(email) {
  return this.find({ buyerEmail: email.toLowerCase() }).sort({ createdAt: -1 });
};

// Static method to get orders by status
orderSchema.statics.findByStatus = function(status) {
  return this.find({ paymentStatus: status }).sort({ createdAt: -1 });
};

// Instance method to calculate total from items
orderSchema.methods.calculateTotal = function() {
  this.totalAmount = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  return this.totalAmount;
};

// Instance method to check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  return this.orderStatus === 'processing' && this.paymentStatus !== 'completed';
};

module.exports = mongoose.model('Order', orderSchema);
