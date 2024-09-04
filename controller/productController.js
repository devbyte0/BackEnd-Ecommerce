const Product = require('../models/Product.js')

exports.getAllProducts = async(req,res)=>{
    try {
        const product = await Product.find();
        res.send(product)
        
    } catch (error) {
        res.send(error)
    }

}


exports.getSingleProduct = async(req,res)=>{
    try {
        const id = req.params.id;
        const product = await Product.findById(id)
        res.send(product)
        console.log(id)
        
    } catch (error) {
        res.send(error)
    }

};

exports.putSingleProduct = async(req,res)=>{
    try {
        const id = req.params.id;

        const {name,description,price,catagories,brand,stock} = req.body

        console.log(price)

        const product =  await Product.findByIdAndUpdate(id,{"$set":{name,
            description,
            price,
            catagories,
            brand,
            stock,
            }})

        if(!product){
            res.send("No Product Found")
        }

        const updatedProduct = await Product.findById(id)
          
        res.send(updatedProduct)

        
    } catch (error) {
        res.send(error)
    }

};

exports.putSingleImage = async(req,res)=>{
    try {
        const id = req.params.id;

        const product =  await Product.findByIdAndUpdate(id,{"$set":{imageUrl:req.file.path}})

        if(!product){
            res.send("No Product Found")
        }

        const updatedProduct = await Product.findById(id)
          
        res.send(updatedProduct)

        
    } catch (error) {
        res.send(error)
    }

};


exports.deleteSingleProduct = async(req,res)=>{
    try {
        const id = req.params.id;

        const product =  await Product.findByIdAndDelete(id)

        if(!product){
            res.send("No Product Found")
        }

        res.send("Deleted")

    } catch (error) {
        res.send(error)
    }

};


exports.CreateProducts = async(req,res)=>{
    try {
        const {name,description,price,catagories,brand,stock} = req.body

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

    } catch (error) {
        res.send(error)
    }
}