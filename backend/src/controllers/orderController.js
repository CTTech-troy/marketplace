// src/controllers/orderController.js
import admin from 'firebase-admin';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import WalletTransaction from '../models/WalletTransaction.js';
import monnifyService from '../services/monnifyService.js';

const DELIVERY_FEE = 500; // ₦500 delivery fee

// POST /orders/checkout
export const checkout = async (req, res) => {
  try {
    const { productId, deliveryFeeIncluded } = req.body;
    const buyerId = req.user.uid; // Firebase UID

    // Fetch product details
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Calculate final amount
    let finalAmount = product.price;
    if (deliveryFeeIncluded) finalAmount += DELIVERY_FEE;

    // Prepare Monnify payload
    const paymentPayload = {
      amount: finalAmount,
      customerName: req.user.name || 'AllTrade User',
      customerEmail: req.user.email || 'noemail@alltrade.com',
      paymentReference: `AT-${Date.now()}-${buyerId}`,
      contractCode: process.env.MONNIFY_CONTRACT_CODE,
      currencyCode: 'NGN',
      paymentDescription: `Payment for ${product.title}`,
      redirectUrl: `${process.env.APP_BASE_URL}/orders/confirm`, // frontend or backend endpoint to confirm
      customerMobileNumber: req.user.phone_number || '08000000000'
    };

    // Initiate payment
    const paymentResponse = await monnifyService.initiatePayment(paymentPayload);

    return res.json({
      paymentUrl: paymentResponse.paymentReferenceUrl,
      paymentReference: paymentResponse.paymentReference,
      amount: finalAmount
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: 'Checkout failed' });
  }
};

// POST /orders/confirm
export const confirmOrder = async (req, res) => {
  try {
    const { paymentReference, status } = req.body;
    // Validate payment status from Monnify webhook or frontend confirmation

    if (status !== 'PAID') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    // Fetch payment details from Monnify or from your DB (depends on your flow)
    // For demo, assume paymentReference contains buyerId and productId info

    // Create order in MongoDB
    const order = new Order({
      buyerId: req.user._id,
      productId: req.body.productId,
      amount: req.body.amount,
      status: 'completed',
      isAnonymous: req.body.isAnonymous || false,
      chatId: req.body.chatId || null
    });

    await order.save();

    // Update wallet balances and transactions
    // Debit buyer
    await WalletTransaction.create({
      userId: req.user._id,
      type: 'debit',
      amount: order.amount,
      reason: 'purchase'
    });

    // Credit seller
    const product = await Product.findById(order.productId);
    await WalletTransaction.create({
      userId: product.sellerId,
      type: 'credit',
      amount: order.amount,
      reason: 'sale'
    });

    // Update wallet balances atomically (simplified)
    await User.findByIdAndUpdate(req.user._id, { $inc: { walletBalance: -order.amount } });
    await User.findByIdAndUpdate(product.sellerId, { $inc: { walletBalance: order.amount, amountMadeFromSales: order.amount } });

    // TODO: Send notification to seller via Firestore FCM

    return res.json({ message: 'Order confirmed and payment successful', orderId: order._id });
  } catch (error) {
    console.error('Order confirmation error:', error);
    return res.status(500).json({ error: 'Order confirmation failed' });
  }
};

export const createOrder = async (req, res) => {
  try {
    const { userId, productId, amount } = req.body;

    const order = await Order.create({ userId, productId, amount, status: 'pending' });
    return res.status(201).json({ order });
  } catch (error) {
    console.error('Create Order Error:', error);
    return res.status(500).json({ error: 'Failed to create order' });
  }
};

export const listOrders = async (req, res) => {
  try {
    const { userId } = req.query;

    const query = userId ? { userId } : {};
    const orders = await Order.find(query);
    return res.status(200).json({ orders });
  } catch (error) {
    console.error('List Orders Error:', error);
    return res.status(500).json({ error: 'Failed to list orders' });
  }
};

export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error('Get Order Error:', error);
    return res.status(500).json({ error: 'Failed to get order' });
  }
};

// Add other functions here using `export const`
