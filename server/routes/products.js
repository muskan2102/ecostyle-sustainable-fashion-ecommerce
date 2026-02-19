const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const validator = require('validator');

// GET /api/products - Get all products with optional filtering
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      minPrice, 
      maxPrice, 
      ecoTag, 
      featured, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { stockQty: { $gt: 0 } };
    
    if (category) {
      filter.category = category.toLowerCase();
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    if (ecoTag) {
      filter.ecoTags = ecoTag.toLowerCase();
    }
    
    if (featured === 'true') {
      filter.featured = true;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalProducts: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/search - Search products by name
router.get('/search', async (req, res) => {
  try {
    const { name, page = 1, limit = 20 } = req.query;
    
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ 
        error: 'Search query must be at least 2 characters long' 
      });
    }

    const searchQuery = name.trim();
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.searchProducts(searchQuery)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments({
      $and: [
        { stockQty: { $gt: 0 } },
        {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { description: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      ]
    });

    res.json({
      products,
      query: searchQuery,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalResults: total
      }
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Failed to search products' });
  }
});

// GET /api/products/featured - Get featured products
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.getFeatured();
    res.json({ products });
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// GET /api/products/categories - Get all available categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    const ecoTags = await Product.distinct('ecoTags');
    
    res.json({ 
      categories: categories.sort(),
      ecoTags: ecoTags.sort()
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/products/:id - Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!validator.isMongoId(id)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Create new product
router.post('/', async (req, res) => {
  try {
    const productData = req.body;
    
    // Validate required fields
    const requiredFields = ['name', 'description', 'price', 'category', 'imageUrl', 'stockQty'];
    const missingFields = requiredFields.filter(field => !productData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields 
      });
    }

    // Validate price
    if (productData.price <= 0 || productData.price > 10000) {
      return res.status(400).json({ 
        error: 'Price must be between $0.01 and $10,000' 
      });
    }

    // Validate stock
    if (productData.stockQty < 0) {
      return res.status(400).json({ 
        error: 'Stock quantity cannot be negative' 
      });
    }

    // Validate category
    const validCategories = ['t-shirts', 'hoodies', 'shoes', 'accessories'];
    if (!validCategories.includes(productData.category.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid category. Must be one of: ' + validCategories.join(', ') 
      });
    }

    // Validate eco tags if provided
    if (productData.ecoTags && Array.isArray(productData.ecoTags)) {
      const validEcoTags = [
        'organic-cotton', 'recycled-materials', 'biodegradable', 'handmade',
        'ethical-manufacturing', 'carbon-neutral', 'water-conservation', 'fair-trade'
      ];
      
      const invalidTags = productData.ecoTags.filter(tag => 
        !validEcoTags.includes(tag.toLowerCase())
      );
      
      if (invalidTags.length > 0) {
        return res.status(400).json({ 
          error: 'Invalid eco tags: ' + invalidTags.join(', ') 
        });
      }
      
      productData.ecoTags = productData.ecoTags.map(tag => tag.toLowerCase());
    }

    const product = new Product(productData);
    await product.save();
    
    res.status(201).json({ 
      message: 'Product created successfully', 
      product 
    });
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation Error', details: errors });
    }
    
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!validator.isMongoId(id)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Validate category if provided
    if (updateData.category) {
      const validCategories = ['t-shirts', 'hoodies', 'shoes', 'accessories'];
      if (!validCategories.includes(updateData.category.toLowerCase())) {
        return res.status(400).json({ 
          error: 'Invalid category. Must be one of: ' + validCategories.join(', ') 
        });
      }
      updateData.category = updateData.category.toLowerCase();
    }

    // Validate price if provided
    if (updateData.price !== undefined) {
      if (updateData.price <= 0 || updateData.price > 10000) {
        return res.status(400).json({ 
          error: 'Price must be between $0.01 and $10,000' 
        });
      }
    }

    // Validate stock if provided
    if (updateData.stockQty !== undefined && updateData.stockQty < 0) {
      return res.status(400).json({ 
        error: 'Stock quantity cannot be negative' 
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    res.json({ 
      message: 'Product updated successfully', 
      product: updatedProduct 
    });
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation Error', details: errors });
    }
    
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!validator.isMongoId(id)) {
      return res.status(400).json({ error: 'Invalid product ID format' });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await Product.findByIdAndDelete(id);
    
    res.json({ 
      message: 'Product deleted successfully',
      productId: id 
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
