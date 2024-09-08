const bcrypt = require('bcrypt');
const saltRounds = 10;
const User = require("../models/User")

exports.getAllUsers = async(req,res)=>{
    try {
        const user = await User.find();
        res.send(user)
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

}


exports.getSingleUser = async (req, res)=>{
    try {
        const id = req.params.id;
        const user = await User.findById(id)
        res.send(user)
        console.log(id)   
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};

exports.putSingleUser = async (req, res) => {
    try {
        const id = req.params.id;

        const { firstName, lastName, email, userName, password } = req.body;

        const trimmedUserName = userName ? userName.trim().toLowerCase() : null;
        const trimmedEmail = email ? email.trim() : null;

        const searchUserName = await User.findOne({userName:trimmedUserName})

        const searchUserEmail = await User.findOne({email:trimmedEmail})
        

        const updates = {};

        if(searchUserName && searchUserEmail){
            return res.status(404).json({message:`${email} and ${userName} is already taken`})
        }

        if(!searchUserName){
            if (userName) updates.userName = userName.trim().toLowerCase();
        }
        else{
           return res.status(404).json({message:`${userName.toLowerCase()} is already taken`})
        }
        if(!searchUserEmail){
            
            if (email) updates.email = email.trim();
        }
        else{
           return res.status(404).json({message:`${email} is already taken`})
        }
        
        if (firstName) updates.firstName = firstName.trim().toUpperCase();

        if (lastName) updates.lastName = lastName.trim().toUpperCase();

        if (password) {
            const salt = bcrypt.genSaltSync(10); // You can adjust the salt rounds
            updates.password = bcrypt.hashSync(password.trim(), salt);
        }

        if(req.file) updates.imageUrl = req.file.path;

        const user = await User.findByIdAndUpdate(id, updates, { new: true });
        
        if (!user) {
            return res.status(404).json({ message: "No User Found" });
        }

        const updateduser = await User.findById(id)
        res.send(updateduser);

    } catch (error) {
        res.status(500).json({ error: error.message });
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
        res.status(500).json({ error: error.message });
    }

};


exports.CreateUser = async(req,res)=>{
    try {
        const {firstName,lastName,email,userName,password} = req.body

        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(password.trim(), salt);
        
        const searchUserName = await User.findOne({userName:userName.trim().toLowerCase()})

        const searchUserEmail = await User.findOne({email:email.trim()})

        if(!searchUserName && !searchUserEmail){
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
           return res.status(404).json({message:`${userName.trim().toLowerCase()} or ${email.trim()} Is Already Taken`})

        }   

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}