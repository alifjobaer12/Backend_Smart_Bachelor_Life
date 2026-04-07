const chatMessageModel = require("../models/chatMessage.model");
const groupModel = require("../models/group.model");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

async function createChatMessage(req, res) {
    const logCtx = getLogContext(req);
    const { groupID, text } = req.body;
    const normalizedText = String(text || "").trim();

    logger.info("Create chat message attempt", {
        ...logCtx,
        groupID,
    });

    if (!groupID || !normalizedText) {
        return res.status(400).json({
            success: false,
            message: "groupID and text are required",
        });
    }

    try {
        const group = await groupModel.findOne({
            _id: groupID,
            $or: [{ managerID: req.user._id }, { userIDs: req.user._id }],
        });

        if (!group) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to send messages in this group",
            });
        }

        const message = await chatMessageModel.create({
            groupID: group._id,
            userID: req.user._id,
            text: normalizedText,
        });

        const populated = await chatMessageModel
            .findById(message._id)
            .populate("userID", "displayName email photoURL");

        return res.status(201).json({
            success: true,
            message: "Chat message sent successfully",
            data: populated,
        });
    } catch (error) {
        logger.error("Create chat message failed", {
            ...logCtx,
            groupID,
            error: getErrorMeta(error),
        });

        return res.status(500).json({
            success: false,
            message: "An error occurred while sending the chat message",
        });
    }
}

async function getChatMessages(req, res) {
    const logCtx = getLogContext(req);
    const { groupID, limit } = req.query;
    const parsedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

    logger.info("Get chat messages attempt", {
        ...logCtx,
        groupID,
        limit: parsedLimit,
    });

    if (!groupID) {
        return res.status(400).json({
            success: false,
            message: "groupID query is required",
        });
    }

    try {
        const group = await groupModel.findOne({
            _id: groupID,
            $or: [{ managerID: req.user._id }, { userIDs: req.user._id }],
        });

        if (!group) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view messages for this group",
            });
        }

        const messages = await chatMessageModel
            .find({ groupID: group._id })
            .sort({ createdAt: -1 })
            .limit(parsedLimit)
            .populate("userID", "displayName email photoURL");

        const ordered = [...messages].reverse();

        return res.status(200).json({
            success: true,
            message: "Chat messages fetched successfully",
            count: ordered.length,
            data: ordered,
        });
    } catch (error) {
        logger.error("Get chat messages failed", {
            ...logCtx,
            groupID,
            error: getErrorMeta(error),
        });

        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching chat messages",
        });
    }
}

module.exports = {
    createChatMessage,
    getChatMessages,
};
