const mongoose = require('mongoose')

const cartproductcardSchema = new mongoose.Schema({
    productId:{
        type:mongoose.ObjectId,
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
    },
    qty:{
        type:Number,
        default:1
    }
})


module.exports = mongoose.model("cartproductcard",cartproductcardSchema)