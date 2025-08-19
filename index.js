// ==============================
// Load environment & dependencies
// ==============================
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const colors = require('colors');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');

// ==============================
// Load routes
// ==============================
const ProductRoutes = require('./routes/ProductRoutes');
const UserRoutes = require('./routes/UserRouter');
const ImageSliderRoutes = require('./routes/SlidersRoute');
const AdminRoutes = require('./routes/AdminRoutes');
const CartRoutes = require('./routes/CartRoutes');
const CategoriesRoutes = require('./routes/CategoriesRoutes');
const ColorRoutes = require('./routes/colorRoutes');
const SizeRoutes = require('./routes/SizeRoutes');
const GenderRoutes = require('./routes/GenderRoutes');
const BadgeRoutes = require('./routes/BadgesRoutes');
const CouponRoutes = require('./routes/CouponRoutes');
const RelatedProductRoutes = require('./routes/RelatedProductRoutes');
const OrderRoutes = require('./routes/OrderRoutes');
const MeasureTypeRoutes = require('./routes/MeasureTypeRoutes');
const ChatRoomRoutes = require('./routes/ChatRoomRoutes');

const orderController = require('./controller/OrderController');

// ==============================
// Initialize environment & DB
// ==============================
dotenv.config();
connectDB();

// ==============================
// Initialize Express & HTTP Server
// ==============================
const app = express();
const server = http.createServer(app);

// ==============================
// Middleware
// ==============================
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
}));
app.use(express.json());

// ==============================
// API Routes
// ==============================
app.use("/api", ProductRoutes);
app.use("/api", UserRoutes);
app.use("/api", ImageSliderRoutes);
app.use("/api", AdminRoutes);
app.use("/api", CartRoutes);
app.use("/api", CategoriesRoutes);
app.use('/api', ColorRoutes);
app.use('/api', SizeRoutes);
app.use('/api', GenderRoutes);
app.use('/api', BadgeRoutes);
app.use('/api', CouponRoutes);
app.use('/api', RelatedProductRoutes);
app.use('/api', OrderRoutes);
app.use('/api', MeasureTypeRoutes);
app.use('/api', ChatRoomRoutes);

// ==============================
// Socket.IO Configuration
// ==============================
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Set socket.io instance in order controller
orderController.setSocketIO(io);

// ==============================
// Connected users
// ==============================
const connectedUsers = new Map();

// ==============================
// Socket.IO Event Handlers
// ==============================
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  // ======================
  // Join user room
  // ======================
  socket.on('joinUserRoom', (userId) => {
    if (!userId) return;
    socket.join(`user_${userId}`);
    connectedUsers.set(socket.id, { userId, userType: 'user' });
    console.log(`👤 User ${userId} joined room user_${userId}`);
  });

  // ======================
  // Join admin room
  // ======================
  socket.on('joinAdminRoom', (adminId) => {
    socket.join('adminRoom');
    connectedUsers.set(socket.id, { userId: adminId, userType: 'admin' });
    console.log(`🛡️ Admin ${adminId} joined admin room`);
  });

  // ======================
  // Chat room logic
  // ======================
  socket.on('joinChatRoom', ({ roomId, userId, userType }) => {
    if (!roomId || !userId) return;
    socket.join(`chat_${roomId}`);
    connectedUsers.set(socket.id, { userId, userType, roomId });
    console.log(`💬 User ${userId} (${userType}) joined chat_${roomId}`);
    io.to('adminRoom').emit('userJoinedRoom', { roomId, userId, userType });
  });

  socket.on('sendMessage', (message) => {
    const { roomId, senderId, senderType, text } = message;
    if (!roomId || !senderId || !text) return;
    const messageData = { senderId, senderType, text, timestamp: new Date(), roomId };
    io.to(`chat_${roomId}`).emit('messageReceived', messageData);
    io.to('adminRoom').emit('messageReceived', messageData);
    console.log(`✉️ Message sent to chat_${roomId} by ${senderId}`);
  });

  socket.on('disconnect', () => {
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      console.log(`❌ Client disconnected: ${userData.userId} (${userData.userType})`);
      connectedUsers.delete(socket.id);
    } else {
      console.log('❌ Anonymous client disconnected');
    }
  });
});

// ==============================
// Start Server
// ==============================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`.bgBlue);
});
