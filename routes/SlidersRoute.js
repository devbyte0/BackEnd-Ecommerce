const express = require("express")
const router = express.Router();
const SliderImagesController = require('../controller/SliderImagesController')
const upload = require("../config/multerconfig")

router.get("/slides",SliderImagesController.getAllSlides);

router.get("/slides/:id",SliderImagesController.getSingleSlide);

router.post("/createslides", upload.single('image') , SliderImagesController.CreateSlides);

router.put("/updateslides/:id", upload.single('image'),SliderImagesController.putSingleSlide);

router.delete("/deleteslides/:id",SliderImagesController.deleteSingleSlide)

module.exports = router;
