const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
    max: [10000, 'Price cannot exceed $10,000']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: ['t-shirts', 'hoodies', 'shoes', 'accessories'],
    lowercase: true
  },
  ecoTags: [{
    type: String,
    enum: [
      'organic-cotton',
      'recycled-materials',
      'biodegradable',
      'handmade',
      'ethical-manufacturing',
      'carbon-neutral',
      'water-conservation',
      'fair-trade'
    ]
  }],
  imageUrl: {
    type: String,
    required: [true, 'Product image URL is required'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(v) || /^https:\/\/via\.placeholder\.com\//.test(v);
      },
      message: 'Please provide a valid image URL'
    }
  },
  stockQty: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  sustainabilityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 75
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for search functionality
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ ecoTags: 1 });
productSchema.index({ featured: 1 });

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toFixed(2)}`;
});

// Virtual for in stock status
productSchema.virtual('inStock').get(function() {
  return this.stockQty > 0;
});

// Pre-save middleware to ensure data consistency
productSchema.pre('save', function(next) {
  if (this.isModified('price')) {
    this.price = Math.round(this.price * 100) / 100; // Round to 2 decimal places
  }
  next();
});

// Static method to get featured products
productSchema.statics.getFeatured = function() {
  return this.find({ featured: true, stockQty: { $gt: 0 } }).sort({ createdAt: -1 });
};

// Static method to search products
productSchema.statics.searchProducts = function(query) {
  return this.find({
    $and: [
      { stockQty: { $gt: 0 } },
      {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Product', productSchema);
