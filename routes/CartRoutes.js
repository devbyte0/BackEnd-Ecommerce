const express = require("express")
const router = express.Router();
const CartController = require('../controller/CartController')

router.get("/cart/:id",CartController.getUsersCart);

router.post("/createcart",CartController.CreateCart);

router.put("/updatecart/:id",CartController.putSingleProductInCart);

router.delete("/deletecart/:id",CartController.deleteAllProductInCart)

router.delete("/deletesinglecartproduct",CartController.deleteSingleProductInCart)

module.exports = router;