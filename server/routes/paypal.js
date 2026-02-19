const express = require('express');
const router = express.Router();
const paypal = require('paypal-rest-sdk');
const Order = require('../models/Order');

// Configure PayPal SDK
console.log('PayPal Configuration:', {
  mode: process.env.PAYPAL_MODE || 'sandbox',
  clientId: process.env.PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET ? 'SET' : 'NOT SET'
});

paypal.configure({
  mode: process.env.PAYPAL_MODE || 'sandbox',
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

// POST /api/paypal/create-payment - Create PayPal payment
router.post('/create-payment', async (req, res) => {
  try {
    const { items, totalAmount, returnUrl, cancelUrl } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }
    
    if (!totalAmount || totalAmount <= 0) {
      return res.status(400).json({ error: 'Valid total amount is required' });
    }

    // Force USD currency and validate amounts
    const currency = 'USD';
    const itemsWithUSD = items.map(item => ({
      name: item.name,
      sku: item.productId || item.product,
      price: parseFloat(item.price).toFixed(2),
      currency: currency,
      quantity: parseInt(item.quantity)
    }));

    // Calculate subtotal to ensure accuracy
    const calculatedSubtotal = itemsWithUSD.reduce((total, item) => {
      return total + (parseFloat(item.price) * item.quantity);
    }, 0);

    // Add shipping (if any) - free shipping over $50
    const shipping = calculatedSubtotal > 50 ? 0 : 10;
    const finalTotal = calculatedSubtotal + shipping;

    // Ensure total amounts match
    if (Math.abs(finalTotal - parseFloat(totalAmount)) > 0.01) {
      console.warn(`Total amount mismatch: calculated ${finalTotal}, received ${totalAmount}`);
      // Use calculated total for accuracy
      totalAmount = finalTotal;
    }

    const paymentJson = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: returnUrl || `${process.env.BASE_URL || 'http://localhost:3000'}/payment/success`,
        cancel_url: cancelUrl || `${process.env.BASE_URL || 'http://localhost:3000'}/payment/cancel`
      },
      transactions: [{
        item_list: {
          items: itemsWithUSD
        },
        amount: {
          currency: currency,
          total: parseFloat(totalAmount).toFixed(2),
          details: {
            subtotal: calculatedSubtotal.toFixed(2),
            shipping: shipping.toFixed(2),
            tax: '0.00'
          }
        },
        description: 'EcoStyle Sustainable Fashion Purchase'
      }]
    };

    console.log('Creating PayPal payment with USD currency:', {
      itemCount: itemsWithUSD.length,
      subtotal: calculatedSubtotal,
      shipping: shipping,
      total: totalAmount,
      currency: currency
    });

    paypal.payment.create(paymentJson, (error, payment) => {
      if (error) {
        console.error('PayPal payment creation error:', error);
        return res.status(500).json({ 
          error: 'Failed to create PayPal payment',
          details: error.response ? error.response.details : error.message
        });
      } else {
        // Extract approval URL
        const approvalUrl = payment.links.find(link => link.rel === 'approval_url');
        if (!approvalUrl) {
          return res.status(500).json({ error: 'PayPal approval URL not found' });
        }

        res.json({
          paymentId: payment.id,
          approvalUrl: approvalUrl.href,
          currency: currency,
          total: totalAmount
        });
      }
    });
  } catch (error) {
    console.error('Error creating PayPal payment:', error);
    res.status(500).json({ error: 'Failed to create PayPal payment' });
  }
});

// POST /api/paypal/execute-payment - Execute PayPal payment
router.post('/execute-payment', async (req, res) => {
  try {
    const { paymentId, payerId, orderData } = req.body;
    
    if (!paymentId || !payerId) {
      return res.status(400).json({ 
        error: 'Payment ID and Payer ID are required' 
      });
    }

    // Force USD currency for execution
    const currency = 'USD';
    const totalAmount = parseFloat(orderData.totalAmount).toFixed(2);

    const execute_payment_json = {
      payer_id: payerId,
      transactions: [{
        amount: {
          currency: currency,
          total: totalAmount
        }
      }]
    };

    console.log('Executing PayPal payment with USD currency:', {
      paymentId,
      totalAmount,
      currency
    });

    paypal.payment.execute(paymentId, execute_payment_json, async (error, payment) => {
      if (error) {
        console.error('PayPal payment execution error:', error);
        return res.status(500).json({ 
          error: 'Failed to execute PayPal payment',
          details: error.response ? error.response.details : error.message
        });
      } else {
        try {
          // Create order in database after successful payment
          const order = new Order({
            ...orderData,
            paymentProvider: 'paypal',
            paymentStatus: 'completed',
            paypalOrderId: paymentId,
            paypalPaymentId: payment.transactions[0].related_resources[0].sale.id,
            orderStatus: 'confirmed',
            currency: currency
          });

          await order.save();

          // Populate product details for response
          await order.populate('items.product', 'name imageUrl description ecoTags');

          res.json({
            success: true,
            message: 'Payment completed successfully',
            order,
            payment: payment,
            currency: currency
          });
        } catch (dbError) {
          console.error('Error creating order after PayPal payment:', dbError);
          res.status(500).json({ 
            error: 'Payment successful but failed to create order',
            details: dbError.message
          });
        }
      }
    });
  } catch (error) {
    console.error('Error executing PayPal payment:', error);
    res.status(500).json({ error: 'Failed to execute PayPal payment' });
  }
});

// GET /api/paypal/payment/:paymentId - Get payment details
router.get('/payment/:paymentId', (req, res) => {
  try {
    const { paymentId } = req.params;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    paypal.payment.get(paymentId, (error, payment) => {
      if (error) {
        console.error('PayPal get payment error:', error);
        return res.status(500).json({ 
          error: 'Failed to get PayPal payment details',
          details: error.response ? error.response.details : error.message
        });
      } else {
        res.json({ payment });
      }
    });
  } catch (error) {
    console.error('Error getting PayPal payment:', error);
    res.status(500).json({ error: 'Failed to get PayPal payment details' });
  }
});

// POST /api/paypal/cancel-payment - Handle payment cancellation
router.post('/cancel-payment', async (req, res) => {
  try {
    const { paymentId, orderData } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    // Create order with cancelled status
    const order = new Order({
      ...orderData,
      paymentProvider: 'paypal',
      paymentStatus: 'cancelled',
      paypalOrderId: paymentId,
      orderStatus: 'cancelled'
    });

    await order.save();

    res.json({
      success: true,
      message: 'Payment cancelled',
      order
    });
  } catch (error) {
    console.error('Error handling PayPal payment cancellation:', error);
    res.status(500).json({ error: 'Failed to handle payment cancellation' });
  }
});

// GET /api/paypal/test - Test PayPal configuration
router.get('/test', (req, res) => {
  try {
    const config = {
      mode: process.env.PAYPAL_MODE || 'sandbox',
      clientId: process.env.PAYPAL_CLIENT_ID ? 'SET' : 'NOT SET',
      clientSecret: process.env.PAYPAL_CLIENT_SECRET ? 'SET' : 'NOT SET'
    };
    
    console.log('PayPal Test Endpoint - Configuration:', config);
    
    res.json({
      success: true,
      message: 'PayPal configuration test',
      config: config,
      paypalSdkLoaded: !!paypal
    });
  } catch (error) {
    console.error('PayPal test error:', error);
    res.status(500).json({ error: 'PayPal test failed', details: error.message });
  }
});

// GET /api/paypal/config - Get PayPal configuration for frontend
router.get('/config', (req, res) => {
  try {
    res.json({
      clientId: process.env.PAYPAL_CLIENT_ID,
      mode: process.env.PAYPAL_MODE || 'sandbox',
      currency: 'USD'
    });
  } catch (error) {
    console.error('Error getting PayPal config:', error);
    res.status(500).json({ error: 'Failed to get PayPal configuration' });
  }
});

// POST /api/paypal/refund/:paymentId - Process refund (admin only)
router.post('/refund/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    // Find the order with this PayPal payment ID
    const order = await Order.findOne({ paypalPaymentId: paymentId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found for this payment' });
    }

    // Force USD currency for refund
    const currency = 'USD';
    const refundData = {
      amount: amount ? {
        total: parseFloat(amount).toFixed(2),
        currency: currency
      } : undefined
    };

    // Get the sale ID from the order
    const saleId = order.paypalPaymentId;
    
    console.log('Processing PayPal refund with USD currency:', {
      paymentId,
      saleId,
      refundAmount: amount,
      currency
    });
    
    paypal.sale.refund(saleId, refundData, async (error, refund) => {
      if (error) {
        console.error('PayPal refund error:', error);
        return res.status(500).json({ 
          error: 'Failed to process refund',
          details: error.response ? error.response.details : error.message
        });
      } else {
        try {
          // Update order status
          order.paymentStatus = 'refunded';
          order.notes = reason || `Refunded: ${refund.id}`;
          order.refundCurrency = currency;
          await order.save();

          res.json({
            success: true,
            message: 'Refund processed successfully',
            refund,
            order,
            currency: currency
          });
        } catch (dbError) {
          console.error('Error updating order after refund:', dbError);
          res.status(500).json({ 
            error: 'Refund processed but failed to update order',
            details: dbError.message
          });
        }
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

module.exports = router;
