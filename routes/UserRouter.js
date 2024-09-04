const express = require("express")
const router = express.Router();
const UserController = require('../controller/UserController')
const upload = require("../config/multerconfig")

router.get("/users",UserController.getAllUsers);

router.get("/users/:id",UserController.getSingleUser);

router.post("/createusers", upload.single('image') , UserController.CreateUser);

router.put("/updateusers/:id", upload.single('image'),UserController.putSingleUser);

router.delete("/deleteusers/:id",UserController.deleteSingleUser)

module.exports = router;