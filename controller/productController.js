const Product = require('../models/Product.js')

exports.getAllProducts = async(req,res)=>{
    try {
        const product = await Product.find();
        res.send(product)
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

}


exports.getSingleProduct = async(req,res)=>{
    try {
        const id = req.params.id;
        const product = await Product.findById(id)
        res.send(product)
        console.log(id)
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};

exports.putSingleProduct = async(req,res)=>{
    try {
        const id = req.params.id;

        const {name,description,price,catagories,brand,stock} = req.body

        const trimmedName = name ? name.trim().toLowerCase() : null;

        const searchUserName = await User.findOne({name:trimmedName})

        const update = {}

        if(!searchUserName){
            if(name) update.name = name;
        }
        else{
            return res.status(404).json({message:` ${name} named product already exsists`})
        }
        if(description) update.description = description;
        if(price) update.price = price;
        if(catagories) update.catagories = catagories;
        if(brand) update.brand = brand;
        if(stock) update.stock = stock;
        if(req.file) update.imageUrl = req.file.path;

        console.log(price)

        const product =  await Product.findByIdAndUpdate(id,update,{new:true})

        if(!product){
          return  res.status(404).json({message:"No Product Found"})
        }

        const updatedProduct = await Product.findById(id)
          
        res.send(updatedProduct)

        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};

exports.deleteSingleProduct = async(req,res)=>{
    try {
        const id = req.params.id;

        const product =  await Product.findByIdAndDelete(id)

        if(!product){
           return res.status(404).json("No Product Found")
        }

        res.send("Deleted")

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};


exports.CreateProducts = async(req,res)=>{
    try {
        const {name,description,price,catagories,brand,stock} = req.body

        const trimmedName = name ? name.trim().toLowerCase() : null;

        const searchUserName = await User.findOne({name:trimmedName})

        if(!searchUserName){
            const product = new Product({
                name,
                description,
                price,
                catagories,
                brand,
                stock,
                imageUrl: req.file.path,
            })
    
            await product.save();
    
            res.send(product)
        }
        else{
            return res.status(404).json({message:` ${name} named product already exsists`})
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}