const express = require("express")
const router = express.Router();
const CartController = require('../controller/CartController')
const upload = require("../config/multerconfig")

router.get("/cart/:id",CartController.getUsersCart);

router.post("/createcart/:id",upload.single('image'),CartController.CreateCart);

router.put("/updatecart/:id",upload.single('image'),CartController.putSingleProductInCart);

router.delete("/deletecart/:id",CartController.deleteAllProductInCart)

router.delete("/deletesinglecartproduct/:id",upload.single('image'),CartController.deleteSingleProductInCart)

module.exports = router;