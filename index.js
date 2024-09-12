const express = require('express');
const app = express();
const dotenv = require("dotenv");
const connectDB = require('./config/db');
const colors = require('colors')
const ProductRoutes = require('./routes/ProductRoutes')
const UserRoutes = require("./routes/UserRouter")
const ImageSliderRoutes = require("./routes/SlidersRoute")
const AdminRoutes = require("./routes/AdminRoutes")
const CartRoutes = require("./routes/CartRoutes")
const cors = require('cors')

app.use(cors())

dotenv.config();

connectDB();

app.use(express.json());

app.use("/api",ProductRoutes)

app.use("/api",UserRoutes)

app.use("/api",ImageSliderRoutes)

app.use("/api",AdminRoutes)

app.use("/api",CartRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, ()=>{
    console.log(`server Running on port ${PORT}`.bgBlue)
})

