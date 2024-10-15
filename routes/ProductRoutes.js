const express = require("express")
const router = express.Router();
const ProductController = require('../controller/productController')
const upload = require("../config/multerconfig")

router.get("/products",ProductController.getAllProducts);


router.get("/products/:id",ProductController.getSingleProduct);

router.post("/createproducts", upload.single('image') , ProductController.CreateProducts);

router.put("/updateproducts/:id", upload.single('image'),ProductController.putSingleProduct);

router.delete("/deleteproducts/:id",ProductController.deleteSingleProduct)

module.exports = router;
