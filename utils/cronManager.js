const cron = require('node-cron');
const Order = require('../models/Order');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { 
  sendOrderConfirmation, 
  sendOrderProcessing, 
  sendOrderDelivered, 
  sendOrderShipped,
  sendOrderCancelled,
  sendOrderFinalization
} = require('./emailService');

// Schedule order confirmation emails (every 5 minutes)
const scheduleOrderConfirmationEmails = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔄 Running order confirmation email cron job...');
    await processOrderConfirmationEmails();
  });
};

// Schedule order processing emails (every 10 minutes)
const scheduleOrderProcessingEmails = () => {
  cron.schedule('*/10 * * * *', async () => {
    console.log('🔄 Running order processing email cron job...');
    await processOrderProcessingEmails();
  });
};

// Schedule order shipped emails (every 12 minutes)
const scheduleOrderShippedEmails = () => {
  cron.schedule('*/12 * * * *', async () => {
    console.log('🔄 Running order shipped email cron job...');
    await processOrderShippedEmails();
  });
};

// Schedule order delivered emails (every 15 minutes)
const scheduleOrderDeliveredEmails = () => {
  cron.schedule('*/15 * * * *', async () => {
    console.log('🔄 Running order delivered email cron job...');
    await processOrderDeliveredEmails();
  });
};

// Schedule order cancelled emails (every 5 minutes)
const scheduleOrderCancelledEmails = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔄 Running order cancelled email cron job...');
    await processOrderCancelledEmails();
  });
};

// Schedule order finalization emails (every 8 minutes)
const scheduleOrderFinalizationEmails = () => {
  cron.schedule('*/8 * * * *', async () => {
    console.log('🔄 Running order finalization email cron job...');
    await processOrderFinalizationEmails();
  });
};

// Schedule order reactivation (every 10 minutes)
const scheduleOrderReactivation = () => {
  cron.schedule('*/10 * * * *', async () => {
    console.log('🔄 Running order reactivation cron job...');
    await processOrderReactivation();
  });
};

// Schedule OTP cleanup (every hour)
const scheduleOTPCleanup = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('🔄 Running OTP cleanup cron job...');
    await cleanupExpiredOTPs();
  });
};

// Process order confirmation emails
const processOrderConfirmationEmails = async () => {
  try {
    const orders = await Order.find({
      orderStatus: 'pending',
      emailSent: { $ne: 'confirmation' },
      isActive: true
    }).populate('userId', 'email fullName');

    console.log(`📧 Found ${orders.length} orders pending confirmation emails`);

    for (const order of orders) {
      try {
        if (order.userId && order.userId.email) {
          const emailResult = await sendOrderConfirmation(order, order.userId);
          if (emailResult.success) {
            await Order.findByIdAndUpdate(order._id, {
              $set: { emailSent: 'confirmation' }
            });
            console.log(`✅ Confirmation email sent for order #${order.orderId}`);
          } else {
            console.log(`⚠️ Failed to send confirmation email for order #${order.orderId}: ${emailResult.message}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error sending confirmation email for order #${order.orderId}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in processOrderConfirmationEmails:', error.message);
  }
};

// Process order processing emails
const processOrderProcessingEmails = async () => {
  try {
    const orders = await Order.find({
      orderStatus: 'processing',
      emailSent: { $nin: ['processing', 'shipped'] },
      isActive: true
    }).populate('userId', 'email fullName');

    console.log(`📧 Found ${orders.length} orders pending processing emails`);

    for (const order of orders) {
      try {
        if (order.userId && order.userId.email) {
          const emailResult = await sendOrderProcessing(order, order.userId);
          if (emailResult.success) {
            await Order.findByIdAndUpdate(order._id, {
              $set: { emailSent: 'processing' }
            });
            console.log(`✅ Processing email sent for order #${order.orderId}`);
          } else {
            console.log(`⚠️ Failed to send processing email for order #${order.orderId}: ${emailResult.message}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error sending processing email for order #${order.orderId}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in processOrderProcessingEmails:', error.message);
  }
};

// Process order shipped emails
const processOrderShippedEmails = async () => {
  try {
    const orders = await Order.find({
      orderStatus: 'shipped',
      emailSent: { $ne: 'shipped' },
      isActive: true
    }).populate('userId', 'email fullName');

    console.log(`📧 Found ${orders.length} orders pending shipped emails`);

    for (const order of orders) {
      try {
        if (order.userId && order.userId.email) {
          const emailResult = await sendOrderShipped(order, order.userId);
          if (emailResult.success) {
            await Order.findByIdAndUpdate(order._id, {
              $set: { emailSent: 'shipped' }
            });
            console.log(`✅ Shipped email sent for order #${order.orderId}`);
          } else {
            console.log(`⚠️ Failed to send shipped email for order #${order.orderId}: ${emailResult.message}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error sending shipped email for order #${order.orderId}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in processOrderShippedEmails:', error.message);
  }
};

// Process order delivered emails
const processOrderDeliveredEmails = async () => {
  try {
    const orders = await Order.find({
      orderStatus: 'delivered',
      emailSent: { $ne: 'delivered' },
      isActive: true
    }).populate('userId', 'email fullName');

    console.log(`📧 Found ${orders.length} orders pending delivered emails`);

    for (const order of orders) {
      try {
        if (order.userId && order.userId.email) {
          const emailResult = await sendOrderDelivered(order, order.userId);
          if (emailResult.success) {
            await Order.findByIdAndUpdate(order._id, {
              $set: { emailSent: 'delivered' }
            });
            console.log(`✅ Delivered email sent for order #${order.orderId}`);
          } else {
            console.log(`⚠️ Failed to send delivered email for order #${order.orderId}: ${emailResult.message}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error sending delivered email for order #${order.orderId}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in processOrderDeliveredEmails:', error.message);
  }
};

// Process order cancelled emails
const processOrderCancelledEmails = async () => {
  try {
    const orders = await Order.find({
      orderStatus: { $in: ['cancelled', 'canceled'] },
      emailSent: { $ne: 'cancelled' },
      isActive: false
    }).populate('userId', 'email fullName');

    console.log(`📧 Found ${orders.length} orders pending cancelled emails`);

    for (const order of orders) {
      try {
        if (order.userId && order.userId.email) {
          const emailResult = await sendOrderCancelled(order, order.userId);
          if (emailResult.success) {
            await Order.findByIdAndUpdate(order._id, {
              $set: { emailSent: 'cancelled' }
            });
            console.log(`✅ Cancelled email sent for order #${order.orderId}`);
          } else {
            console.log(`⚠️ Failed to send cancelled email for order #${order.orderId}: ${emailResult.message}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error sending cancelled email for order #${order.orderId}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in processOrderCancelledEmails:', error.message);
  }
};

// Process order finalization emails
const processOrderFinalizationEmails = async () => {
  try {
    const orders = await Order.find({
      orderStatus: 'finalized',
      emailSent: { $ne: 'finalized' },
      isActive: true
    }).populate('userId', 'email fullName');

    console.log(`📧 Found ${orders.length} orders pending finalization emails`);

    for (const order of orders) {
      try {
        if (order.userId && order.userId.email) {
          const emailResult = await sendOrderFinalization(order, order.userId);
          if (emailResult.success) {
            await Order.findByIdAndUpdate(order._id, {
              $set: { emailSent: 'finalized' }
            });
            console.log(`✅ Finalization email sent for order #${order.orderId}`);
          } else {
            console.log(`⚠️ Failed to send finalization email for order #${order.orderId}: ${emailResult.message}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error sending finalization email for order #${order.orderId}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in processOrderFinalizationEmails:', error.message);
  }
};

// Process order reactivation (when admin changes status from cancelled to other status)
const processOrderReactivation = async () => {
  try {
    const orders = await Order.find({
      orderStatus: { $nin: ['cancelled', 'canceled'] },
      isActive: false,
      emailSent: 'cancelled' // Only reactivate orders that were previously cancelled
    });

    console.log(`🔄 Found ${orders.length} orders to reactivate`);

    for (const order of orders) {
      try {
        await Order.findByIdAndUpdate(order._id, {
          $set: { 
            isActive: true,
            emailSent: null // Reset email sent status to allow new status emails
          }
        });
        console.log(`✅ Order #${order.orderId} reactivated`);
      } catch (error) {
        console.error(`❌ Error reactivating order #${order.orderId}:`, error.message);
      }
    }
  } catch (error) {
    console.error('❌ Error in processOrderReactivation:', error.message);
  }
};

// Cleanup expired OTPs
const cleanupExpiredOTPs = async () => {
  try {
    const result = await OTP.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    console.log(`🧹 Cleaned up ${result.deletedCount} expired OTPs`);
  } catch (error) {
    console.error('❌ Error in cleanupExpiredOTPs:', error.message);
  }
};

// Manual trigger functions for testing
const triggerOrderConfirmationEmails = () => {
  console.log('🚀 Manually triggering order confirmation emails...');
  return processOrderConfirmationEmails();
};

const triggerOrderProcessingEmails = () => {
  console.log('🚀 Manually triggering order processing emails...');
  return processOrderProcessingEmails();
};

const triggerOrderShippedEmails = () => {
  console.log('🚀 Manually triggering order shipped emails...');
  return processOrderShippedEmails();
};

const triggerOrderDeliveredEmails = () => {
  console.log('🚀 Manually triggering order delivered emails...');
  return processOrderDeliveredEmails();
};

const triggerOrderCancelledEmails = () => {
  console.log('🚀 Manually triggering order cancelled emails...');
  return processOrderCancelledEmails();
};

const triggerOrderFinalizationEmails = () => {
  console.log('🚀 Manually triggering order finalization emails...');
  return processOrderFinalizationEmails();
};

const triggerOrderReactivation = () => {
  console.log('🚀 Manually triggering order reactivation...');
  return processOrderReactivation();
};

const triggerOTPCleanup = () => {
  console.log('🚀 Manually triggering OTP cleanup...');
  return cleanupExpiredOTPs();
};

// Initialize all cron jobs
const initializeCronJobs = () => {
  console.log('⏰ Initializing cron jobs...');
  
  scheduleOrderConfirmationEmails();
  scheduleOrderProcessingEmails();
  scheduleOrderShippedEmails();
  scheduleOrderDeliveredEmails();
  scheduleOrderCancelledEmails();
  scheduleOrderFinalizationEmails();
  scheduleOrderReactivation();
  scheduleOTPCleanup();
  
  console.log('✅ All cron jobs initialized successfully');
};

module.exports = {
  initializeCronJobs,
  triggerOrderConfirmationEmails,
  triggerOrderProcessingEmails,
  triggerOrderShippedEmails,
  triggerOrderDeliveredEmails,
  triggerOrderCancelledEmails,
  triggerOrderFinalizationEmails,
  triggerOrderReactivation,
  triggerOTPCleanup,
  processOrderConfirmationEmails,
  processOrderProcessingEmails,
  processOrderShippedEmails,
  processOrderDeliveredEmails,
  processOrderCancelledEmails,
  processOrderFinalizationEmails,
  processOrderReactivation,
  cleanupExpiredOTPs
};
