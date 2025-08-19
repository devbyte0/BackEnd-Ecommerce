const express = require("express");
const router = express.Router();
const ChatController = require("../controller/ChatRoomController");
const { authenticateAdmin } = require("../middleware/AdminAuthMiddleware");
const authenticate = require("../middleware/UserAuthMiddleware");




// Customer Routes
router.get("/user/rooms/:customerId", authenticate, ChatController.getOrCreateRoom);

// Shared Routes
router.post("/user/rooms/:roomId/message", authenticate, ChatController.sendMessage);
router.post("/user/rooms/:roomId/messages/:messageId/reaction", authenticate, ChatController.addReaction);

// Admin Routes
router.post("/rooms/:roomId/transfer", authenticateAdmin, ChatController.transferAdmin);
router.post("/rooms/:roomId/close", authenticateAdmin, ChatController.closeRoom);

// Get all chat rooms
router.get("/rooms", authenticateAdmin, ChatController.getAllRooms);

// Get specific chat room
router.get("rooms/:roomId", authenticateAdmin, ChatController.getRoomById);

module.exports = router;