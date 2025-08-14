const express = require('express');
const router = express.Router();

const AdminController = require('../controller/adminController'); // Full controller with auth & CRUD
const upload = require('../config/multerconfig');
const {authenticateAdmin} = require('../middleware/AdminAuthMiddleware'); // Validates access token

// 🔐 Auth & Session
router.post('/admin/login', AdminController.login);                          // Admin login
router.post('/admin/register',  upload.single('image'), AdminController.register); // Register (superAdmin only)
router.post('/admin/logout', authenticateAdmin, AdminController.logout); 
router.post("/admin/verify-token",  AdminController.verifyToken)    
router.post('/admin/refresh-token', AdminController.refreshToken);           // Get new access token

// 🔒 Create/Update/Delete admins (superAdmin only)
router.post('/create-admin', authenticateAdmin, upload.single('image'), AdminController.createAdmin);
router.put('/update-admin/:id', authenticateAdmin, upload.single('image'), AdminController.updateAdmin);
router.delete('/delete-admin', authenticateAdmin, AdminController.deleteAdmin);

// 📍 Admin info
router.get('/admin/:id', authenticateAdmin, AdminController.getSingleAdmin);       // View one
router.get('/admins', authenticateAdmin, AdminController.getAllAdmins);            // View all (superAdmin only)

module.exports = router;