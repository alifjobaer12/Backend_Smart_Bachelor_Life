const express = require("express");

const {
    createChatMessage,
    getChatMessages,
} = require("../controllers/chat.controller");
const { authUserMiddleware } = require("../middlewares/auth.middleware");

const chatRouter = express.Router();

/**
 * - send a chat message in a group
 * - POST /api/chat/messages
 * - protected route, requires valid Firebase ID token and group membership
 */
chatRouter.post("/messages", authUserMiddleware, createChatMessage);

/**
 * - get chat messages for a group
 * - GET /api/chat/messages?groupID=<id>&limit=50
 * - protected route, requires valid Firebase ID token and group membership
 */
chatRouter.get("/messages", authUserMiddleware, getChatMessages);

module.exports = chatRouter;
