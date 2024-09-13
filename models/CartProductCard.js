const mongoose = require('mongoose')

const cartproductcardSchema = new mongoose.Schema({
    userId:{
        type:String,
        required:true   
    },
    name:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    updatedPrice:{
        type:Number
    },
    brand:{
        type:String,
        default:"No Brand Name"
    },
    imageUrl:{
        type:String,
        required:true
    },
    qty:{
        type:Number,
        default:1
    }
},{timestamps:true})


module.exports = mongoose.model("cartproductcard",cartproductcardSchema)