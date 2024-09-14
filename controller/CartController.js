const Product = require('../models/Product.js')
const CartProductCard = require("../models/CartProductCard.js")
const Cart = require("../models/Cart.js")
const User = require("../models/User.js");


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
        const userId = req.params.id;
        const {productId,qty} = req.body

        const existingCart = await Cart.findOne({ userId });
        const existingProductInCart =  existingCart.CartProductCard.find(
            (cartProduct) => cartProduct.productId.toString() === productId
        );

        const cartProductCard = await CartProductCard.findOne({ userId,productId });

       
            
        if (existingProductInCart && cartProductCard) {
            // If the product is already in the cart, increase its quantity
            existingProductInCart.qty = parseInt(qty);
            existingProductInCart.updatedPrice = existingProductInCart.price*existingProductInCart.qty
             // Explicitly mark the subdocument as modified
            existingCart.markModified('CartProductCard');
            const total = existingCart.CartProductCard.reduce((sum, cartProduct) => {
                return sum + cartProduct.updatedPrice;
            }, 0);
            
            existingCart.totalPrice = parseInt(total)
            await existingCart.save();
            cartProductCard.qty = parseInt(qty)
            cartProductCard.updatedPrice = cartProductCard.price*cartProductCard.qty
            await cartProductCard.save();
            

            return res.send(existingCart);

        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};

exports.deleteSingleProductInCart = async(req,res)=>{
    try {
        
        const userId = req.params.id;
        const {productId} = req.body

        const cartProductCard = await CartProductCard.findOneAndDelete({ userId,productId });

        if(!cartProductCard){
            res.status(404).json({ message:"not found"});
        }

        const existingCart = await Cart.findOne({ userId });
        const productIndex = existingCart.CartProductCard.findIndex(
            (cartProduct) => cartProduct.productId.toString() === productId
        );

        if (productIndex === -1) {
            return res.status(404).json({ message: "Product not found in cart" });
        }

        // Remove the product from the cart array
        existingCart.CartProductCard.splice(productIndex, 1);
        //For the sum of total
        const total = existingCart.CartProductCard.reduce((sum, cartProduct) => {
            return sum + cartProduct.updatedPrice;
        }, 0);
        
        existingCart.totalPrice = parseInt(total)

        // Save the updated cart
        await existingCart.save();

       
        res.send(existingCart)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};

exports.deleteAllProductInCart = async(req,res)=>{
    try {
        const userId = req.params.id;
        
        const existingCart = await Cart.findOneAndDelete({ userId });
        const cartProductCard = await CartProductCard.findOneAndDelete({ userId});

        if(!cartProductCard && !existingCart){
           return res.status(404).json("No Product Found")
        }
        
        res.status(200).json({
            message: "Product removed successfully"
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error)
    }

};


exports.CreateCart = async (req, res) => {
    try {
        const userId = req.params.id;
        const { productId } = req.body;

        // Find the cart and the user
        const existingCart = await Cart.findOne({ userId });
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the product to add to the cart
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // If the cart doesn't exist or has no products
        if (!existingCart || existingCart.CartProductCard.length === 0) {
            // Create a new CartProductCard
            const newCartProductCard = new CartProductCard({
                userId,
                productId,
                name: product.name,
                price: product.price,
                updatedPrice: product.price,
                brand: product.brand,
                imageUrl: product.imageUrl,
            });

            await newCartProductCard.save();

            // Create a new cart
            const newCart = new Cart({
                userId,
                userName: user.userName,
                CartProductCard: [newCartProductCard],
                totalPrice: product.price  
            });

            await newCart.save();
            return res.send(newCart);
        } else {
            // If the cart already exists, check if the product is in the cart
            const existingProductInCart =  existingCart.CartProductCard.find(
                (cartProduct) => cartProduct.productId.toString() === productId
            );

            const cartProductCard = await CartProductCard.findOne({ userId,productId });

           
                
            if (existingProductInCart && cartProductCard) {
                // If the product is already in the cart, increase its quantity
                existingProductInCart.qty += 1;
                existingProductInCart.updatedPrice = existingProductInCart.price*existingProductInCart.qty
                 // Explicitly mark the subdocument as modified
                existingCart.markModified('CartProductCard');
                const total = existingCart.CartProductCard.reduce((sum, cartProduct) => {
                    return sum + cartProduct.updatedPrice;
                }, 0);
                
                existingCart.totalPrice = parseInt(total);

                 // Save the cart after updating the product quantity
                await existingCart.save();

                cartProductCard.qty += 1;
                cartProductCard.updatedPrice = cartProductCard.price*cartProductCard.qty
                await cartProductCard.save();

               


                return res.send(existingCart);  // Send back the updated cart 
  
            } else {
                // If the product is not in the cart, add it
                const newCartProductCard = new CartProductCard({
                    userId,
                    productId,
                    name: product.name,
                    price: product.price,
                    updatedPrice: product.price,
                    brand: product.brand,
                    imageUrl: product.imageUrl,
                });

                await newCartProductCard.save();
                const total = existingCart.CartProductCard.reduce((sum, cartProduct) => {
                    return sum + cartProduct.updatedPrice;
                }, 0);
                
                existingCart.totalPrice = parseInt(total)
                // Push the new product card to the existing cart
                existingCart.CartProductCard.push(newCartProductCard);
                await existingCart.save();

                return res.send(existingCart);  // Return the updated cart with the new product
            }
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
