const Order = require('../models/Order');
const User = require('../models/User');
const mongoose = require('mongoose');

// Socket.io instance (set from server.js)
let ioInstance = null;
module.exports.setSocketIO = (io) => {
  ioInstance = io;
};

// Helper function for socket notifications
function notifyOrderUpdate(order, eventType) {
  if (!ioInstance) return;

  const events = {
    create: {
      admin: 'admin:newOrder',
      user: `user:orderUpdate:${order.userId}`
    },
    update: {
      admin: 'admin:updateOrder',
      user: `user:orderUpdate:${order.userId}`
    },
    cancel: {
      admin: 'admin:cancelOrder',
      user: `user:orderUpdate:${order.userId}`
    },
    delete: {
      admin: 'admin:orderDeleted'
    }
  };

  const event = events[eventType];
  if (!event) return;

  // Notify admin
  if (event.admin) {
    ioInstance.to('adminRoom').emit(event.admin, order);
  }

  // Notify specific user
  if (event.user && order.userId) {
    ioInstance.to(`user_${order.userId}`).emit(event.user, {
      eventType,
      order
    });
  }
}

// Generate unique 10-digit orderId
async function generateOrderId() {
  const MAX_ATTEMPTS = 10;
  let orderId;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < MAX_ATTEMPTS) {
    orderId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    exists = await Order.exists({ orderId });
    attempts++;
  }

  if (exists) {
    throw new Error(`Could not generate unique orderId after ${MAX_ATTEMPTS} attempts`);
  }
  return orderId;
}

module.exports.getAllOrders = async (req, res) => {
  try {
    const isAdmin = !!req.admin;
    const userDocId = req.user?._id;

    // Query params
    const {
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      paymentStatus,
      userId,
      orderId,
      q,
      from,
      to,
      isActive,
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    // Base filter
    const filter = {};

    // Role constraint
    if (isAdmin) {
      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        filter.userId = userId;
      }
    } else {
      if (!userDocId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      filter.userId = userDocId;
    }

    // Exact orderId
    if (orderId) {
      filter.orderId = orderId.trim();
    }

    // Order status filter
    if (status) {
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length) filter.orderStatus = { $in: statuses };
    }

    // Payment status filter
    if (paymentStatus) {
      const pStatuses = paymentStatus.split(',').map(s => s.trim()).filter(Boolean);
      if (pStatuses.length) filter.paymentStatus = { $in: pStatuses };
    }

    // isActive filter
    if (typeof isActive === 'string') {
      if (isActive.toLowerCase() === 'true') filter.isActive = true;
      if (isActive.toLowerCase() === 'false') filter.isActive = false;
    }

    // Date range
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    // Free-text search
    if (q && q.trim()) {
      const rx = new RegExp(q.trim(), 'i');
      filter.$or = [
        { orderId: rx },
        { couponCode: rx },
        { 'shippingAddress.fullName': rx },
        { 'items.name': rx },
      ];
    }

    // Sorting
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Query + total
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return res.json({
      data: orders,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        sortBy,
        sortOrder,
        filtersApplied: {
          isAdmin,
          userId: filter.userId?.toString?.() || undefined,
          status: filter.orderStatus?.$in,
          paymentStatus: filter.paymentStatus?.$in,
          orderId: filter.orderId,
          isActive: filter.isActive,
          from: from || undefined,
          to: to || undefined,
          q: q || undefined,
        },
      },
    });
  } catch (err) {
    console.error('Get Orders Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      userId,
      items,
      totalAmount,
      discountAmount,
      couponCode,
      shippingAddress,
      paymentMethod,
      paymentDetails,
      selectedPaymentMethodId,
    } = req.body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0 ||
      !totalAmount || !shippingAddress || !paymentMethod) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate shipping address
    const requiredShippingFields = ['fullName', 'address', 'city', 'postalCode', 'country', 'phone'];
    for (const field of requiredShippingFields) {
      if (!shippingAddress[field]?.trim()) {
        await session.abortTransaction();
        return res.status(400).json({ message: `Shipping address '${field}' is required` });
      }
    }

    // Validate items
    for (const item of items) {
      if (!item.variantId || !item.productId || !item.name ||
        typeof item.discountApplied !== 'number' ||
        !item.quantity || !item.price || !item.mainImage ||
        !item.measureType || !item.unitName) {
        await session.abortTransaction();
        return res.status(400).json({ message: 'Each item must include required fields' });
      }
    }

    // Verify user exists
    const user = await User.findById(userId).session(session).lean();
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'User not found' });
    }

    // Handle payment method
    let selectedPaymentMethod;
    if (paymentMethod.toLowerCase() === 'cash on delivery' || paymentMethod.toLowerCase() === 'cash') {
      selectedPaymentMethod = {
        methodId: 'cash',
        type: 'Cash on Delivery',
        label: 'Cash on Delivery',
      };
    } else {
      const method = (user.paymentMethods || []).find(
        m => m._id.toString() === selectedPaymentMethodId
      );
      if (!method) {
        await session.abortTransaction();
        return res.status(404).json({ message: 'Payment method not found' });
      }

      selectedPaymentMethod = {
        methodId: method._id,
        type: method.type,
        label: method.label || `${method.type} ${method.walletNumberMasked || ''}`,
      };
    }

    const normalizedPaymentMethod = paymentMethod.toLowerCase() === 'cash on delivery'
      ? 'Cash on Delivery'
      : paymentMethod;

    // Create order
    const orderId = await generateOrderId();
    const newOrder = new Order({
      orderId,
      userId,
      items,
      totalAmount,
      discountAmount,
      couponCode,
      shippingAddress,
      paymentMethod: normalizedPaymentMethod,
      selectedPaymentMethod,
      paymentDetails,
      paymentStatus: 'pending',
      orderStatus: 'pending',
      isActive: true,
    });

    const savedOrder = await newOrder.save({ session });
    await session.commitTransaction();

    // Notify via Socket.IO
    notifyOrderUpdate(savedOrder, 'create');
    
    return res.status(201).json(savedOrder);
  } catch (err) {
    await session.abortTransaction();
    console.error('Create Order Error:', err);
    return res.status(500).json({ message: err.message || 'Server error' });
  } finally {
    session.endSession();
  }
};

module.exports.getOrderByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) return res.status(400).json({ message: 'Order ID required' });

    const order = await Order.findOne({ orderId }).lean();
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Format items for response
    order.items = order.items.map(item => ({
      ...item,
      variant: {
        size: item.size,
        color: item.color,
        measureType: item.measureType,
        unitName: item.unitName
      }
    }));

    return res.json(order);
  } catch (err) {
    console.error('Get Order Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getOrders = async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId && mongoose.Types.ObjectId.isValid(userId) ? { userId } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (err) {
    console.error('Get Orders Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    if (!orderId) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Order ID required' });
    }

    const allowedOrderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const allowedPaymentStatuses = ['pending', 'completed', 'failed', 'refunded'];

    const update = {};
    if (orderStatus && allowedOrderStatuses.includes(orderStatus)) update.orderStatus = orderStatus;
    if (paymentStatus && allowedPaymentStatuses.includes(paymentStatus)) update.paymentStatus = paymentStatus;

    if (Object.keys(update).length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'No valid status provided' });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId },
      update,
      { new: true, session }
    );

    if (!updatedOrder) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Order not found' });
    }

    await session.commitTransaction();
    
    // Notify via Socket.IO
    notifyOrderUpdate(updatedOrder, 'update');
    
    return res.json(updatedOrder);
  } catch (err) {
    await session.abortTransaction();
    console.error('Update Order Status Error:', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    session.endSession();
  }
};

module.exports.cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;

    if (!orderId) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Order ID is required' });
    }

    const order = await Order.findOne({ orderId }).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!['pending', 'processing'].includes(order.orderStatus)) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Cannot cancel order with status '${order.orderStatus}'`
      });
    }

    order.orderStatus = 'cancelled';
    order.isActive = false;

    const updatedOrder = await order.save({ session });
    await session.commitTransaction();

    notifyOrderUpdate(updatedOrder, 'cancel');

    return res.json({ 
      success: true,
      message: 'Order cancelled successfully',
      order: updatedOrder 
    });

  } catch (err) {
    await session.abortTransaction();
    console.error('Cancel Order Error:', err);
    return res.status(500).json({ 
      success: false,
      message: err.message || 'Failed to cancel order' 
    });
  } finally {
    session.endSession();
  }
};

module.exports.deleteOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;
    if (!orderId) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Order ID required' });
    }

    const deletedOrder = await Order.findByIdAndDelete(orderId).session(session);
    if (!deletedOrder) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Order not found' });
    }

    await session.commitTransaction();

    // Notify via Socket.IO
    notifyOrderUpdate({ 
      _id: orderId,
      orderId: deletedOrder.orderId,
      deletedAt: new Date(),
      deletedBy: req.user?.id || 'system' 
    }, 'delete');
    
    return res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    await session.abortTransaction();
    console.error('Delete Order Error:', err);
    return res.status(500).json({ message: 'Server error' });
  } finally {
    session.endSession();
  }
};