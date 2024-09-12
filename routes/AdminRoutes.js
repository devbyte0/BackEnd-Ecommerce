const express = require("express")
const router = express.Router();
const AdminController = require('../controller/adminController')
const upload = require("../config/multerconfig")

router.get("/admins",AdminController.getAllAdmins);

router.get("/admins/:id",AdminController.getSingleAdmin);

router.post("/createadmins", upload.single('image') , AdminController.CreateAdmins);

router.put("/updateadmins/:id", upload.single('image'),AdminController.putSingleAdmin);

router.delete("/deleteadmins/:id",AdminController.deleteSingleAdmin)

module.exports = router;