const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
    userId:{
        type:mongoose.ObjectId,
        required:true
    },
    CartProductCard:{
        type:Array,
        required:true
    }
})


module.exports = mongoose.model("cart",cartSchema)