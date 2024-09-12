const mongoose = require('mongoose')


const adminSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
    },
    lastName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    userName:{
        type:String,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
    imageUrl:{
        type:String,
        required:true
    },
    superAdmin:{
        type:Boolean,
        default:false
    }
},{timestamps:true})


module.exports = mongoose.model("admin",adminSchema)