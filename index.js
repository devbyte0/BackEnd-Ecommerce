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
  origin: "http://localhost:5173", // ✅ Removed trailing slash
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

// ==============================
// Socket.IO for real-time viewers
// ==============================
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Set socket.io instance in order controller
orderController.setSocketIO(io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join user-specific room if authenticated
  socket.on('joinUserRoom', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`User ${userId} joined their room`);
    }
  });

  // Join admin room
  socket.on('joinAdminRoom', () => {
    socket.join('adminRoom');
    console.log('Admin joined admin room');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});


const viewers = {};

function randomIntFromInterval(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

io.on('connection', (socket) => {
  console.log('🔌 Client connected');

  socket.on('joinProduct', (productId) => {
    socket.join(productId);

    // If product not tracked yet, set random starting count
    if (!viewers[productId]) {
      viewers[productId] = randomIntFromInterval(500, 1000);
    }

    // Increment viewer count
    viewers[productId]++;
    io.to(productId).emit('viewerCountUpdate', viewers[productId]);

    console.log(`📦 Product ${productId} viewers: ${viewers[productId]}`);

    socket.on('disconnect', () => {
      if (viewers[productId]) {
        viewers[productId] = Math.max(viewers[productId] - 1, 0);
        io.to(productId).emit('viewerCountUpdate', viewers[productId]);
        console.log(`❌ Left product ${productId}, viewers: ${viewers[productId]}`);
      }
    });
  });
});

// ==============================
// Start Server
// ==============================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`.bgBlue);
});
