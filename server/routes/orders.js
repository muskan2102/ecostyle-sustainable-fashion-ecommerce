const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const validator = require('validator');

// GET /api/orders - Get all orders (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { 
      email, 
      status, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object - for demo, return all orders if no filters
    const filter = {};
    
    // Only apply filters if provided (for demo purposes)
    if (email && email !== 'demo@example.com') {
      filter.buyerEmail = email.toLowerCase();
    }
    
    if (status) {
      filter.paymentStatus = status.toLowerCase();
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(filter)
      .populate('items.product', 'name imageUrl')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/history - Get order history (all orders for demo)
router.get('/history', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // For demo, return all orders sorted by creation date
    const orders = await Order.find({})
      .populate('items.product', 'name imageUrl description ecoTags')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Order.countDocuments();

    res.json({
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalOrders: total,
        hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});

// GET /api/orders/order-number/:orderNumber - Get order by order number
router.get('/order-number/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    if (!orderNumber) {
      return res.status(400).json({ error: 'Order number is required' });
    }

    const order = await Order.findOne({ orderNumber: orderNumber.toUpperCase() })
      .populate('items.product', 'name imageUrl description ecoTags');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error fetching order by number:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// GET /api/orders/:id - Get single order by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // More lenient ID validation - try both MongoDB ObjectId and order number
    let order;
    
    if (validator.isMongoId(id)) {
      order = await Order.findById(id)
        .populate('items.product', 'name imageUrl description ecoTags');
    } else {
      // Try to find by order number if not a valid ObjectId
      order = await Order.findOne({ orderNumber: id.toUpperCase() })
        .populate('items.product', 'name imageUrl description ecoTags');
    }
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders - Create new order
router.post('/', async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validate required fields
    const requiredFields = ['items', 'buyerEmail', 'shippingAddress'];
    const missingFields = requiredFields.filter(field => !orderData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        missingFields 
      });
    }

    // Validate email
    if (!validator.isEmail(orderData.buyerEmail)) {
      return res.status(400).json({ 
        error: 'Invalid email address' 
      });
    }

    // Validate items array
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      return res.status(400).json({ 
        error: 'Order must contain at least one item' 
      });
    }

    // Validate each item
    for (const item of orderData.items) {
      if (!item.product || !item.name || !item.price || !item.quantity) {
        return res.status(400).json({ 
          error: 'Each item must have product, name, price, and quantity' 
        });
      }
      
      if (item.quantity <= 0) {
        return res.status(400).json({ 
          error: 'Item quantity must be greater than 0' 
        });
      }
      
      if (item.price <= 0) {
        return res.status(400).json({ 
          error: 'Item price must be greater than 0' 
        });
      }
    }

    // Validate shipping address
    const requiredAddressFields = ['street', 'city', 'state', 'zipCode', 'country'];
    const missingAddressFields = requiredAddressFields.filter(
      field => !orderData.shippingAddress[field]
    );
    
    if (missingAddressFields.length > 0) {
      return res.status(400).json({ 
        error: 'Missing required shipping address fields', 
        missingFields: missingAddressFields 
      });
    }

    // Calculate total amount
    const totalAmount = orderData.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    orderData.totalAmount = totalAmount;
    orderData.buyerEmail = orderData.buyerEmail.toLowerCase();

    const order = new Order(orderData);
    await order.save();
    
    res.status(201).json({ 
      message: 'Order created successfully', 
      order 
    });
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation Error', details: errors });
    }
    
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT /api/orders/:id - Update order
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!validator.isMongoId(id)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Validate payment status if provided
    if (updateData.paymentStatus) {
      const validStatuses = ['pending', 'completed', 'failed', 'cancelled', 'refunded'];
      if (!validStatuses.includes(updateData.paymentStatus)) {
        return res.status(400).json({ 
          error: 'Invalid payment status. Must be one of: ' + validStatuses.join(', ') 
        });
      }
    }

    // Validate order status if provided
    if (updateData.orderStatus) {
      const validStatuses = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(updateData.orderStatus)) {
        return res.status(400).json({ 
          error: 'Invalid order status. Must be one of: ' + validStatuses.join(', ') 
        });
      }
    }

    // Don't allow updating items or total amount directly
    delete updateData.items;
    delete updateData.totalAmount;

    const updatedOrder = await Order.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('items.product', 'name imageUrl');

    res.json({ 
      message: 'Order updated successfully', 
      order: updatedOrder 
    });
  } catch (error) {
    console.error('Error updating order:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: 'Validation Error', details: errors });
    }
    
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// PUT /api/orders/:id/payment-status - Update payment status
router.put('/:id/payment-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paypalOrderId, paypalPaymentId } = req.body;
    
    if (!validator.isMongoId(id)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    if (!paymentStatus) {
      return res.status(400).json({ error: 'Payment status is required' });
    }

    const validStatuses = ['pending', 'completed', 'failed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ 
        error: 'Invalid payment status. Must be one of: ' + validStatuses.join(', ') 
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updateData = { paymentStatus };
    
    if (paypalOrderId) {
      updateData.paypalOrderId = paypalOrderId;
    }
    
    if (paypalPaymentId) {
      updateData.paypalPaymentId = paypalPaymentId;
    }

    // Update order status based on payment status
    if (paymentStatus === 'completed') {
      updateData.orderStatus = 'confirmed';
    } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
      updateData.orderStatus = 'cancelled';
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('items.product', 'name imageUrl');

    res.json({ 
      message: 'Payment status updated successfully', 
      order: updatedOrder 
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// DELETE /api/orders/:id - Delete order (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!validator.isMongoId(id)) {
      return res.status(400).json({ error: 'Invalid order ID format' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only allow deletion of orders that are not completed
    if (order.paymentStatus === 'completed') {
      return res.status(400).json({ 
        error: 'Cannot delete completed orders' 
      });
    }

    await Order.findByIdAndDelete(id);
    
    res.json({ 
      message: 'Order deleted successfully',
      orderId: id 
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;
