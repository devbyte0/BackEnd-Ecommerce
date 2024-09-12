const Product = require('../models/Product.js')
const CartProductCard = require("../models/CartProductCard.js")
const Cart = require("../models/Cart.js")

exports.getUsersCart = async(req,res)=>{
    try {
        const id = req.params.id;
        const cart = await Cart.findOne({userId:id})
        res.send(cart)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};

exports.putSingleProductInCart = async(req,res)=>{
    try {
        
        const {productId,qty} = req.body
       
        const Searcartproductcard =  await CartProductCard.find({productId:Searchproduct._id})

            if(Searcartproductcard){

                const update = Searcartproductcard.qty+1
                
                const product = await CartProductCard.findOneAndUpdate({userId:Searcartproductcard.id},{qty:update})
                res.send(product)
            }
           
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};

exports.deleteSingleProductInCart = async(req,res)=>{
    try {
        
        const {productId} = req.body

        const product =  await CartProductCard.findOneAndDelete({userId:productId})

        if(!product){
           return res.status(404).json("No Product Found")
        }

        res.send("Deleted")

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};

exports.deleteAllProductInCart = async(req,res)=>{
    try {
        const id = req.params.id;
        

        const product =  await Cart.findOneAndDelete({userId:id})

        if(!product){
           return res.status(404).json("No Product Found")
        }

        res.send("Deleted")

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};


exports.CreateCart = async(req,res)=>{
    try {
        const id = req.params.id;
        
        const {productId} = req.body

        const Searchcart =  await Cart.find({userId:id})

        if(Searchcart.CartProductCard.length < 1){
            const Searchproduct =  await Product.find({_id:productId})


            const cartproductcard = new CartProductCard({
                productId:Searchproduct._id,
                name:Searchproduct.name,
                price:Searchproduct.price,
                catagories:Searchproduct.catagories,
                brand:Searchproduct.brand,
                imageUrl:Searchproduct.imageUrl,
            })
    
            await cartproductcard.save();

            const cart = new Cart({
                userId:id,
                CartProductCard:cartproductcard
            })
    
            await cart.save();
    
            res.send(cart)
        }
        else{
            const Searchproduct =  await Product.find({_id:productId})
            
            const Searcartproductcard =  await CartProductCard.find({productId:Searchproduct._id})

            if(Searcartproductcard){

                const update = Searcartproductcard.qty+1
                
                const product = await CartProductCard.findOneAndUpdate({productId:Searcartproductcard.id},{qty:update})
                res.send(product)
            }
            else{
                const Searchproduct =  await Product.find({_id:productId})


            const cartproductcard = new CartProductCard({
                productId:Searchproduct._id,
                name:Searchproduct.name,
                price:Searchproduct.price,
                catagories:Searchproduct.catagories,
                brand:Searchproduct.brand,
                imageUrl:Searchproduct.imageUrl,
            })
               const product = await CartProductCard.findOneAndUpdate({userId:id},{$push:{CartProductCard:cartproductcard}})

               if(!product){
                         return  res.status(404).json({message:"No Product Found"})
                       }
                       const updatedcart = await Cart.findOne({userId:id})
                       res.send(updatedcart)  
            }

            
        }

        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}