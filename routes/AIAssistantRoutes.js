const express = require('express');
const router = express.Router();
const ctrl = require('../controller/AIAssistantController');

router.post('/ai-assistant/chat', ctrl.chat);
router.get('/ai-assistant/history', ctrl.history);
router.delete('/ai-assistant/clear', ctrl.clear);

module.exports = router;
