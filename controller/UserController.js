const bcrypt = require('bcrypt');
const saltRounds = 16;
const User = require("../models/User")

exports.getAllUsers = async(req,res)=>{
    try {
        const user = await User.find();
        res.send(user)
        
    } catch (error) {
        res.send(error)
    }

}


exports.getSingleUser = async(req,res)=>{
    try {
        const id = req.params.id;
        const user = await User.findById(id)
        res.send(user)
        console.log(id)   
    } catch (error) {
        res.send(error)
    }

};



exports.putSingleUser = async(req,res)=>{
    try {
        const id = req.params.id;

        const { firstName, lastName, email, userName, password } = req.body;

        console.log(userName)

        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(password.trim(), salt);
        
            const user =  await User.findByIdAndUpdate(id,{"$set":{"firstName":firstName.trim().toUpperCase(),
                "lastName":lastName.trim().toUpperCase(),
                "email":email.trim(),
                "userName":userName.trim().toLowerCase(),
                "password": hash,
                "imageUrl": req.file.path}})

                await user.save();
    
            if(!user){
                res.send("No User Found")
            }

            const updatedUser = await User.findById(id)
              
            res.send(updatedUser)
        

    } catch (error) {
        res.send(error)
    }
};



exports.deleteSingleUser = async(req,res)=>{
    try {
        const id = req.params.id;

        const user =  await User.findByIdAndDelete(id)

        if(!user){
            res.send("No User Found")
        }

        res.send("Deleted")

    } catch (error) {
        res.send(error)
    }

};


exports.CreateUser = async(req,res)=>{
    try {
        const {firstName,lastName,email,userName,password} = req.body

        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(password.trim(), salt);
        
        const searchUserUserName = await User.findOne({userName:userName.trim().toLowerCase()})

        const searchUserEmail = await User.findOne({email:email.trim()})

        if(!searchUserUserName && !searchUserEmail){
            const user = new User({
                firstName:firstName.trim().toUpperCase(),
                lastName:lastName.trim().toUpperCase(),
                email:email.trim(),
                userName:userName.trim().toLowerCase(),
                password: hash,
                imageUrl: req.file.path,
            })
    
            await user.save();
    
            res.send(user)
        }
        else{
            res.send("UserName or Email Is Already Taken")

        }   

    } catch (error) {
        res.send(error)
    }
}