const Contact = require('../models/Contact');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');

// Submit contact form (Public)
exports.submitContact = catchAsyncErrors(async (req, res, next) => {
  const { name, email, subject, message } = req.body;

  // Get client information
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');

  const contact = await Contact.create({
    name,
    email,
    subject,
    message,
    ipAddress,
    userAgent
  });

  res.status(201).json({
    success: true,
    message: 'Your message has been sent successfully! We will get back to you soon.',
    contact
  });
});

// Get all contacts (Admin)
exports.getAllContacts = catchAsyncErrors(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter object
  const filter = {};
  
  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  if (req.query.priority) {
    filter.priority = req.query.priority;
  }
  
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { subject: { $regex: req.query.search, $options: 'i' } },
      { message: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const contacts = await Contact.find(filter)
    .populate('resolvedBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Contact.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    success: true,
    contacts,
    pagination: {
      page,
      limit,
      total,
      totalPages
    }
  });
});

// Get single contact (Admin)
exports.getContact = catchAsyncErrors(async (req, res, next) => {
  const contact = await Contact.findById(req.params.id)
    .populate('resolvedBy', 'name email');

  if (!contact) {
    return next(new ErrorHandler('Contact not found', 404));
  }

  res.status(200).json({
    success: true,
    contact
  });
});

// Update contact status (Admin)
exports.updateContactStatus = catchAsyncErrors(async (req, res, next) => {
  const { status, priority, adminNotes } = req.body;
  
  const contact = await Contact.findById(req.params.id);
  
  if (!contact) {
    return next(new ErrorHandler('Contact not found', 404));
  }

  // Update fields
  if (status) contact.status = status;
  if (priority) contact.priority = priority;
  if (adminNotes !== undefined) contact.adminNotes = adminNotes;
  
  // If status is resolved, set resolvedBy and resolvedAt
  if (status === 'resolved') {
    contact.resolvedBy = req.admin.id;
    contact.resolvedAt = new Date();
  }

  await contact.save();

  res.status(200).json({
    success: true,
    message: 'Contact updated successfully',
    contact
  });
});

// Delete contact (Admin)
exports.deleteContact = catchAsyncErrors(async (req, res, next) => {
  const contact = await Contact.findById(req.params.id);
  
  if (!contact) {
    return next(new ErrorHandler('Contact not found', 404));
  }

  await contact.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Contact deleted successfully'
  });
});

// Get contact statistics (Admin)
exports.getContactStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Contact.getStats();

  // Get recent contacts (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentContacts = await Contact.countDocuments({
    createdAt: { $gte: sevenDaysAgo }
  });

  // Get priority breakdown
  const priorityStats = await Contact.aggregate([
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);

  const priorityBreakdown = priorityStats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    stats: {
      ...stats,
      recentContacts,
      priorityBreakdown
    }
  });
});

// Mark contact as resolved (Admin)
exports.markAsResolved = catchAsyncErrors(async (req, res, next) => {
  const { adminNotes } = req.body;
  
  const contact = await Contact.findById(req.params.id);
  
  if (!contact) {
    return next(new ErrorHandler('Contact not found', 404));
  }

  await contact.markAsResolved(req.admin.id, adminNotes);

  res.status(200).json({
    success: true,
    message: 'Contact marked as resolved',
    contact
  });
});

// Bulk update contacts (Admin)
exports.bulkUpdateContacts = catchAsyncErrors(async (req, res, next) => {
  const { contactIds, status, priority } = req.body;
  
  if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
    return next(new ErrorHandler('Please provide contact IDs', 400));
  }

  const updateData = {};
  if (status) updateData.status = status;
  if (priority) updateData.priority = priority;
  
  if (status === 'resolved') {
    updateData.resolvedBy = req.admin.id;
    updateData.resolvedAt = new Date();
  }

  const result = await Contact.updateMany(
    { _id: { $in: contactIds } },
    updateData
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} contacts updated successfully`,
    modifiedCount: result.modifiedCount
  });
});

// Export contacts (Admin)
exports.exportContacts = catchAsyncErrors(async (req, res, next) => {
  const { status, startDate, endDate } = req.query;
  
  const filter = {};
  
  if (status) {
    filter.status = status;
  }
  
  if (startDate && endDate) {
    filter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const contacts = await Contact.find(filter)
    .populate('resolvedBy', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    contacts,
    exportInfo: {
      total: contacts.length,
      dateRange: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
      status: status || 'All statuses'
    }
  });
});
