const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        default:"No description"
    },
    price:{
        type:Number,
        required:true
    },
    catagories:{
        type:String,
        default:"Uncatagoriesed"
    },
    brand:{
        type:String,
        default:"No Brand Name"
    },
    stock:{
        type:Number,
        required:true,
        default:0
    },
    imageUrl:{
        type:String,
        required:true
    }
},{timestamps:true});

module.exports = mongoose.model("product",productSchema);