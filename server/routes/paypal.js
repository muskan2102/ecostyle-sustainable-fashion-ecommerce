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

// GET /api/paypal/execute-payment - Handle PayPal redirect (GET with query params)
router.get('/execute-payment', async (req, res) => {
  try {
    const { paymentId, PayerID, token } = req.query;
    
    console.log('PayPal GET execute request received:', { 
      paymentId, 
      payerId: PayerID, 
      token,
      method: req.method,
      query: req.query
    });
    
    if (!paymentId || !PayerID) {
      console.error('Missing PayPal parameters in GET:', { paymentId, payerId: PayerID });
      return res.status(400).json({ 
        error: 'Payment ID and Payer ID are required',
        received: { paymentId, payerId: PayerID }
      });
    }

    // For GET requests, we need to create a minimal order or get from session
    // This is a simplified version - in production, you'd store order data in session
    const execute_payment_json = {
      payer_id: PayerID,
      transactions: [{
        amount: {
          currency: 'USD',
          total: '0.00' // Will be updated based on actual payment
        }
      }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, async (error, payment) => {
      if (error) {
        console.error('PayPal GET execution error:', {
          error: error,
          paymentId,
          payerId: PayerID,
          executeJson: execute_payment_json
        });
        return res.status(500).json({ 
          error: 'Failed to execute PayPal payment',
          message: error.message,
          details: error.response ? error.response.details : 'No details available',
          stack: error.stack
        });
      } else {
        console.log('PayPal GET payment executed successfully:', { 
          paymentId: payment.id,
          state: payment.state 
        });
        
        
        res.json({
          success: true,
          message: 'Payment executed successfully',
          paymentId: payment.id,
          state: payment.state,
          redirect: '/orders' 
        });
      }
    });
  } catch (error) {
    console.error('PayPal GET execute unexpected error:', error);
    res.status(500).json({ 
      error: 'Failed to execute PayPal payment',
      message: error.message,
      stack: error.stack
    });
  }
});


router.post('/execute-payment', async (req, res) => {
  try {
   
    const { paymentId, payerId, orderData } = { ...req.query, ...req.body };
    
    console.log('PayPal execute request received:', { 
      paymentId, 
      payerId, 
      hasOrderData: !!orderData,
      method: req.method,
      query: req.query,
      body: req.body 
    });
    
    if (!paymentId || !payerId) {
      console.error('Missing PayPal parameters:', { paymentId, payerId });
      return res.status(400).json({ 
        error: 'Payment ID and Payer ID are required',
        received: { paymentId, payerId }
      });
    }


    const currency = 'USD';
    

    let totalAmount = '0.00';
    if (orderData && orderData.totalAmount) {
      totalAmount = parseFloat(orderData.totalAmount).toFixed(2);
    }

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
        console.error('PayPal payment execution error:', {
          error: error,
          paymentId,
          payerId,
          executeJson: execute_payment_json
        });
        return res.status(500).json({ 
          error: 'Failed to execute PayPal payment',
          message: error.message,
          details: error.response ? error.response.details : 'No details available',
          stack: error.stack
        });
      } else {
        console.log('PayPal payment executed successfully:', { 
          paymentId: payment.id,
          state: payment.state 
        });
        try {
          
          if (!orderData || !orderData.items) {
            console.error('Missing order data for order creation');
            return res.status(400).json({
              error: 'Order data is required to create order',
              paymentId: payment.id
            });
          }

          console.log('Creating order with data:', {
            orderData,
            paymentId: payment.id,
            paypalPaymentId: payment.transactions[0].related_resources[0].sale.id
          });

          const order = new Order({
            orderNumber: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            items: orderData.items,
            totalAmount: orderData.totalAmount,
            buyerEmail: orderData.buyerEmail || 'demo@example.com',
            shippingAddress: orderData.shippingAddress || {
              street: 'Demo Street',
              city: 'Demo City',
              state: 'Demo State',
              zipCode: '12345',
              country: 'US'
            },
            paymentProvider: 'paypal',
            paymentStatus: 'completed',
            paypalOrderId: paymentId,
            paypalPaymentId: payment.transactions[0].related_resources[0].sale.id,
            orderStatus: 'confirmed',
            currency: currency
          });

          console.log('Order object created, attempting to save...');
          
          try {
            await order.save();
            console.log('✅ Order saved successfully:', order.orderNumber);
          } catch (saveError) {
            console.error('❌ Order save error:', saveError);
            console.error('Validation errors:', saveError.errors);
            return res.status(500).json({
              error: 'Payment successful but failed to create order',
              message: saveError.message,
              details: saveError.errors,
              stack: saveError.stack
            });
          }

          await order.populate('items.product', 'name imageUrl description ecoTags');

          console.log('Order created and populated successfully:', order.orderNumber);

          res.json({
            success: true,
            message: 'Payment completed successfully',
            orderId: order._id,
            orderNumber: order.orderNumber,
            order,
            payment: payment,
            currency: currency
          });
        } catch (dbError) {
          console.error('Error creating order after PayPal payment:', dbError);
          res.status(500).json({ 
            error: 'Payment successful but failed to create order',
            message: dbError.message,
            stack: dbError.stack
          });
        }
      }
    });
  } catch (error) {
    console.error('PayPal POST execute unexpected error:', {
      error: error,
      paymentId,
      payerId,
      orderData: orderData
    });
    res.status(500).json({ 
      error: 'Failed to execute PayPal payment',
      message: error.message,
      stack: error.stack
    });
  }
});


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


router.post('/cancel-payment', async (req, res) => {
  try {
    const { paymentId, orderData } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

   
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


router.post('/refund/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;
    
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID is required' });
    }

    
    const order = await Order.findOne({ paypalPaymentId: paymentId });
    if (!order) {
      return res.status(404).json({ error: 'Order not found for this payment' });
    }


    const currency = 'USD';
    const refundData = {
      amount: amount ? {
        total: parseFloat(amount).toFixed(2),
        currency: currency
      } : undefined
    };

  
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
