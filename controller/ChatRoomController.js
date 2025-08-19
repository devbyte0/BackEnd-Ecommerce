const ChatRoom = require("../models/ChatRoom");
const { NotFoundError, BadRequestError } = require("../errors/errors");

exports.getOrCreateRoom = async (req, res) => {
  try {
    const { customerId } = req.params;
    const userId = req.user?._id;

    // Validate input
    if (!customerId || !userId) {
      throw new BadRequestError('Customer ID and User ID are required');
    }

    let room = await ChatRoom.findOne({
      $or: [
        { customerId, isClosed: false },
        { participants: userId, isClosed: false }
      ]
    })
    .populate('participants', 'name profileImage')
    .populate('assignedAdmin', 'name email');

    if (!room) {
      room = await ChatRoom.create({ 
        customerId,
        participants: [userId],
        messages: []
      });
      
      // Notify admin room about new chat
      const io = req.app.get('socketio');
      io.to('adminRoom').emit('newChatRoom', room);
    }

    res.json(room);
  } catch (err) {
    console.error('Error in getOrCreateRoom:', err);
    res.status(err.statusCode || 500).json({ 
      message: err.message || 'Server error' 
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { text } = req.body;
    const senderId = req.user?._id || req.admin?._id;
    const senderType = req.user ? "user" : "admin";

    // Validate input
    if (!roomId || !text || !senderId) {
      throw new BadRequestError('Room ID, text, and sender ID are required');
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      throw new NotFoundError('Chat room not found');
    }

    if (room.isClosed) {
      throw new BadRequestError('Cannot send message to closed chat room');
    }

    const newMessage = { 
      senderId, 
      senderType, 
      text,
      reaction: "",
      createdAt: new Date()
    };
    
    room.messages.push(newMessage);
    await room.save();

    // Emit via socket
    const io = req.app.get('socketio');
    io.to(`chat_${roomId}`).emit("messageReceived", newMessage);
    io.to('adminRoom').emit("messageReceived", { ...newMessage, roomId });

    res.status(201).json(newMessage);
  } catch (err) {
    console.error('Error in sendMessage:', err);
    res.status(err.statusCode || 500).json({ 
      message: err.message || 'Server error' 
    });
  }
};

exports.transferAdmin = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { newAdminId } = req.body;
    const currentAdminId = req.admin._id;

    if (!roomId || !newAdminId) {
      throw new BadRequestError('Room ID and new admin ID are required');
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      throw new NotFoundError('Chat room not found');
    }

    // Check if current admin is assigned to this room
    if (room.assignedAdmin && !room.assignedAdmin.equals(currentAdminId)) {
      throw new BadRequestError('Only assigned admin can transfer this room');
    }

    room.assignedAdmin = newAdminId;
    await room.save();

    // Notify via socket
    const io = req.app.get('socketio');
    io.to(`chat_${roomId}`).emit("roomTransferred", { 
      roomId, 
      newAdminId,
      transferredBy: currentAdminId
    });
    io.to('adminRoom').emit("roomTransferred", { 
      roomId, 
      newAdminId,
      transferredBy: currentAdminId
    });

    res.json(room);
  } catch (err) {
    console.error('Error in transferAdmin:', err);
    res.status(err.statusCode || 500).json({ 
      message: err.message || 'Server error' 
    });
  }
};

exports.closeRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const adminId = req.admin._id;

    if (!roomId) {
      throw new BadRequestError('Room ID is required');
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      throw new NotFoundError('Chat room not found');
    }

    // Check if admin is assigned to this room
    if (room.assignedAdmin && !room.assignedAdmin.equals(adminId)) {
      throw new BadRequestError('Only assigned admin can close this room');
    }

    room.isClosed = true;
    room.closedBy = adminId;
    room.closedAt = new Date();
    await room.save();

    // Notify via socket
    const io = req.app.get('socketio');
    io.to(`chat_${roomId}`).emit("roomClosed", { 
      roomId, 
      closedBy: adminId 
    });
    io.to('adminRoom').emit("roomClosed", { 
      roomId, 
      closedBy: adminId 
    });

    res.json({ 
      message: "Room closed successfully", 
      roomId,
      closedBy: adminId,
      closedAt: room.closedAt
    });
  } catch (err) {
    console.error('Error in closeRoom:', err);
    res.status(err.statusCode || 500).json({ 
      message: err.message || 'Server error' 
    });
  }
};

exports.addReaction = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user?._id || req.admin?._id;

    if (!roomId || !messageId || !emoji) {
      throw new BadRequestError('Room ID, message ID and emoji are required');
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      throw new NotFoundError('Chat room not found');
    }

    const msg = room.messages.id(messageId);
    if (!msg) {
      throw new NotFoundError('Message not found');
    }

    // Toggle reaction if same user, or set new reaction
    msg.reaction = msg.reaction === emoji ? "" : emoji;
    msg.reactedBy = userId;
    await room.save();

    // Notify via socket
    const io = req.app.get('socketio');
    io.to(`chat_${roomId}`).emit("messageUpdated", { 
      messageId, 
      reaction: msg.reaction,
      reactedBy: userId
    });

    res.json({
      messageId,
      reaction: msg.reaction,
      reactedBy: userId
    });
  } catch (err) {
    console.error('Error in addReaction:', err);
    res.status(err.statusCode || 500).json({ 
      message: err.message || 'Server error' 
    });
  }
};

// Get all chat rooms (optionally filter by assignedAdmin)
exports.getAllRooms = async (req, res) => {
  try {
    const adminId = req.admin._id;

    const rooms = await ChatRoom.find({ isClosed: false })
      .populate('customerId', 'name profileImage')
      .populate('assignedAdmin', 'name email')
      .sort({ updatedAt: -1 }); // latest first

    res.json(rooms);
  } catch (err) {
    console.error("Error in getAllRooms:", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Server error" });
  }
};

// Get specific chat room by ID
exports.getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
    if (!roomId) throw new BadRequestError("Room ID is required");

    const room = await ChatRoom.findById(roomId)
      .populate('customerId', 'name profileImage')
      .populate('assignedAdmin', 'name email');

    if (!room) throw new NotFoundError("Chat room not found");

    res.json(room);
  } catch (err) {
    console.error("Error in getRoomById:", err);
    res.status(err.statusCode || 500).json({ message: err.message || "Server error" });
  }
};