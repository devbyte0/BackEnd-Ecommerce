const bcrypt = require('bcryptjs');
const saltRounds = 10;
const Admin = require("../models/Admin")

exports.getAllAdmins = async(req,res)=>{
    try {
        const id = req.params.id;
        const SuperAdmin = Admin.findById(id)
        if(SuperAdmin.superAdmin === true){
            const admin = await Admin.find();
            res.send(admin)
        }
        res.send({Message:"sorry you are not a superAdmin"})
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

}


exports.getSingleAdmin = async (req, res)=>{
    try {
        const id = req.params.id;
        const admin = await Admin.findById(id)
        res.send(admin)   
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};

exports.putSingleAdmin = async (req, res) => {
    try {
        const id = req.params.id;

        const { firstName, lastName, email, userName, password ,superAdmin} = req.body;

        const trimmedUserName = userName ? userName.trim().toLowerCase() : null;
        const trimmedEmail = email ? email.trim() : null;

        const searchUserName = await Admin.findOne({userName:trimmedUserName})

        const searchUserEmail = await Admin.findOne({email:trimmedEmail})
        

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

        if(superAdmin) updates.superAdmin = superAdmin;

        const admin = await Admin.findByIdAndUpdate(id, updates, { new: true });
        
        if (!admin) {
            return res.status(404).json({ message: "No User Found" });
        }

        const updatedAdmin = await Admin.findById(id)
        res.send(updatedAdmin);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



exports.deleteSingleAdmin = async(req,res)=>{
    try {
        const id = req.params.id;

        const {deleteAdminId} = req.body

        const searchSuperAdmin = await Admin.findOne({superAdmin:true})

        if(!searchSuperAdmin){
            const admin =  await Admin.findByIdAndDelete(deleteAdminId)

            if(!admin){
                res.send("No User Found")
            }
        }
        else{
            return res.status(404).json({message:`${searchSuperAdmin.userName} is the super Admin`})
        }
        res.send("Deleted")

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};


exports.CreateAdmins = async(req,res)=>{
    try {
        const { firstName, lastName, email, userName, password ,superAdmin} = req.body;

        const salt = bcrypt.genSaltSync(saltRounds);
        const hash = bcrypt.hashSync(password.trim(), salt);
        
        const searchUserName = await Admin.findOne({userName:userName.trim().toLowerCase()})

        const searchUserEmail = await Admin.findOne({email:email.trim()})

        if(!searchUserName && !searchUserEmail){
            const admin = new Admin({
                firstName:firstName.trim().toUpperCase(),
                lastName:lastName.trim().toUpperCase(),
                email:email.trim(),
                userName:userName.trim().toLowerCase(),
                password: hash,
                imageUrl: req.file.path,
                superAdmin
            })
    
            await admin.save();
    
            res.send(admin)
        }
        else{
           return res.status(404).json({message:`${userName.trim().toLowerCase()} or ${email.trim()} Is Already Taken`})

        }   

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}