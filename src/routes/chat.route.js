const express = require("express");

const {
    createChatMessage,
    getChatMessages,
    markChatMessagesAsRead,
    setChatTypingStatus,
    getChatTypingStatus,
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

/**
 * - mark group chat messages as read for current user
 * - PATCH /api/chat/messages/read
 * - protected route, requires valid Firebase ID token and group membership
 */
chatRouter.patch("/messages/read", authUserMiddleware, markChatMessagesAsRead);

/**
 * - set current user's typing status for a group
 * - PATCH /api/chat/typing
 * - protected route, requires valid Firebase ID token and group membership
 */
chatRouter.patch("/typing", authUserMiddleware, setChatTypingStatus);

/**
 * - get active typing users in a group
 * - GET /api/chat/typing?groupID=<id>
 * - protected route, requires valid Firebase ID token and group membership
 */
chatRouter.get("/typing", authUserMiddleware, getChatTypingStatus);

module.exports = chatRouter;
