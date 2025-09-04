const mongoose = require('mongoose')
const dotenv = require('dotenv')
const colors = require('colors')
const path = require('path')

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async ()=>{

    try {
        await mongoose.connect(process.env.DATABASE_URI);
        console.log("DB connected".bgCyan)
        
        
    } catch (error) {
        console.log('Database connection error:', error.message)
        
    }

}


module.exports = connectDB;