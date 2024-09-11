const mongoose = require('mongoose')

const SliderImagesSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        
    },
    brand:{
        type:String,
        default:"No Brand Name"
    },
    imageUrl:{
        type:String,
        required:true
    }
},{timestamps:true});

module.exports = mongoose.model("sliderimages",SliderImagesSchema);