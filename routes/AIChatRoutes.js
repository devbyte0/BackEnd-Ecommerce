const express = require('express');
const router = express.Router();
const { chatWithAI, getChat, deleteChat } = require('../controller/AIChatController');

router.post('/ai/chat', chatWithAI);
router.get('/ai/chat', getChat);
router.delete('/ai/chat', deleteChat);

module.exports = router;
