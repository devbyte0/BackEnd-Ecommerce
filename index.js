// Import required modules
const express = require('express');
const dotenv = require("dotenv");
const connectDB = require('./config/db');
const colors = require('colors');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { createRequire } = require("module");
const { fileURLToPath } = require("url");

const require = createRequire(import.meta.url);

// Import route files
const ProductRoutes = require('./routes/ProductRoutes');
const UserRoutes = require("./routes/UserRouter");
const ImageSliderRoutes = require("./routes/SlidersRoute");
const AdminRoutes = require("./routes/AdminRoutes");
const CartRoutes = require("./routes/CartRoutes");
const CategoriesRoute = require('./routes/CategoriesRoutes');
const colorRoutes = require('./routes/colorRoutes');
const categoryRoutes = require('./routes/CategoriesRoutes');
const sizeRoutes = require('./routes/SizeRoutes');
const genderRoutes = require('./routes/GenderRoutes');
const badgeRoutes = require('./routes/BadgesRoutes');
const couponRoutes = require('./routes/CouponRoutes');
const relatedProductRoutes = require('./routes/RelatedProductRoutes');

// Initialize environment and database connection
dotenv.config();
connectDB();

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "https://new.glitterandgrin.com", // Allow your frontend's origin
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware setup
app.use(cors());
app.use(express.json());

// Serve static files from the dist folder (for Vite React app)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "dist"))); // Serve static files from dist folder

// Redirect all routes to index.html (for frontend routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Define API routes
app.use("/api", ProductRoutes);
app.use("/api", UserRoutes);
app.use("/api", ImageSliderRoutes);
app.use("/api", AdminRoutes);
app.use("/api", CartRoutes);
app.use("/api", CategoriesRoute);
app.use('/api', colorRoutes);
app.use('/api', categoryRoutes);
app.use('/api', sizeRoutes);
app.use('/api', genderRoutes);
app.use('/api', badgeRoutes);
app.use('/api', couponRoutes);
app.use('/api', relatedProductRoutes);

// Socket.io logic for real-time product viewing
let viewers = {};
function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const rndInt = randomIntFromInterval(500, 1000);
console.log(rndInt)

io.on('connection', (socket) => {
  console.log('A person connected');

  socket.on('joinProduct', (productId) => {
    socket.join(productId); // Join the product-specific room first

    // Increase the viewer count for this product
    if (!viewers[productId]) {
      viewers[productId] = rndInt;
    }
    viewers[productId]++;

    // Emit viewer count update to the room
    io.to(productId).emit('viewerCountUpdate', viewers[productId]);

    console.log(`User joined product: ${productId}, Viewers: ${viewers[productId]}`);

    // Handle user disconnecting
    socket.on('disconnect', () => {
      if (viewers[productId]) {
        viewers[productId] = Math.max(viewers[productId] - 1, 0); // Ensure viewer count doesn't go below 0
        io.to(productId).emit('viewerCountUpdate', viewers[productId]);
        console.log(`User disconnected from product: ${productId}, Viewers: ${viewers[productId]}`);
      }
    });
  });
});

// Server listening
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`.bgBlue);
});
