// routes/gender-routes.js
const express = require('express');
const router = express.Router();
const { addGender, getGenders, updateGender, deleteGender } = require('../controller/GenderController');

router.post('/genders', addGender);
router.get('/genders', getGenders);
router.put('/genders/:id', updateGender);
router.delete('/genders/:id', deleteGender);

module.exports = router;
