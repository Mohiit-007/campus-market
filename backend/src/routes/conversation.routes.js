const express = require("express");
const {
    getOrCreateConversation,
    getMyConversations,
    getMessages,
} = require("../controllers/conversation.controller");
const verifyAccessToken = require("../middleware/auth.middleware");

const route = express.Router();

// All conversation routes require login
// A stranger should never be able to read someone's chat

// POST — start or resume a conversation about a product
route.post('/conversations', verifyAccessToken, getOrCreateConversation);

// GET — fetch all chats for the logged-in user
route.get('/conversations', verifyAccessToken, getMyConversations);

// GET — fetch all messages inside one specific conversation
route.get('/conversations/:conversationId/messages', verifyAccessToken, getMessages);

module.exports = route;