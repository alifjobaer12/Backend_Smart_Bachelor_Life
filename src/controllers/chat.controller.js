const chatMessageModel = require("../models/chatMessage.model");
const groupModel = require("../models/group.model");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

const groupTypingState = new Map();

function getTypingMap(groupID) {
    if (!groupTypingState.has(groupID)) {
        groupTypingState.set(groupID, new Map());
    }

    return groupTypingState.get(groupID);
}

function pruneTypingMap(typingMap, maxAgeMs) {
    const now = Date.now();
    for (const [userKey, entry] of typingMap.entries()) {
        if (!entry?.updatedAt || now - entry.updatedAt > maxAgeMs) {
            typingMap.delete(userKey);
        }
    }
}

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
            readBy: [
                {
                    userID: req.user._id,
                    readAt: new Date(),
                },
            ],
        });

        const populated = await chatMessageModel
            .findById(message._id)
            .populate("userID", "displayName email photoURL")
            .populate("readBy.userID", "displayName email");

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
            .populate("userID", "displayName email photoURL")
            .populate("readBy.userID", "displayName email");

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

async function markChatMessagesAsRead(req, res) {
    const logCtx = getLogContext(req);
    const { groupID } = req.body;

    logger.info("Mark chat messages as read attempt", {
        ...logCtx,
        groupID,
    });

    if (!groupID) {
        return res.status(400).json({
            success: false,
            message: "groupID is required",
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
                message: "You are not authorized to mark messages for this group",
            });
        }

        const updateResult = await chatMessageModel.updateMany(
            {
                groupID: group._id,
                "readBy.userID": { $ne: req.user._id },
            },
            {
                $push: {
                    readBy: {
                        userID: req.user._id,
                        readAt: new Date(),
                    },
                },
            },
        );

        return res.status(200).json({
            success: true,
            message: "Messages marked as read",
            modifiedCount: updateResult.modifiedCount || 0,
        });
    } catch (error) {
        logger.error("Mark chat messages as read failed", {
            ...logCtx,
            groupID,
            error: getErrorMeta(error),
        });

        return res.status(500).json({
            success: false,
            message: "An error occurred while marking messages as read",
        });
    }
}

async function setChatTypingStatus(req, res) {
    const logCtx = getLogContext(req);
    const { groupID, isTyping } = req.body;

    if (!groupID) {
        return res.status(400).json({
            success: false,
            message: "groupID is required",
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
                message: "You are not authorized to update typing status for this group",
            });
        }

        const typingMap = getTypingMap(String(group._id));
        const userKey = String(req.user._id);

        if (isTyping) {
            typingMap.set(userKey, {
                userID: userKey,
                email: req.user.email || "",
                displayName: req.user.displayName || req.user.email || "Group Member",
                updatedAt: Date.now(),
            });
        } else {
            typingMap.delete(userKey);
        }

        pruneTypingMap(typingMap, 8000);

        return res.status(200).json({
            success: true,
            message: "Typing status updated",
        });
    } catch (error) {
        logger.error("Set chat typing status failed", {
            ...logCtx,
            groupID,
            error: getErrorMeta(error),
        });

        return res.status(500).json({
            success: false,
            message: "An error occurred while updating typing status",
        });
    }
}

async function getChatTypingStatus(req, res) {
    const logCtx = getLogContext(req);
    const { groupID } = req.query;

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
                message: "You are not authorized to view typing status for this group",
            });
        }

        const typingMap = getTypingMap(String(group._id));
        pruneTypingMap(typingMap, 8000);

        const currentUserKey = String(req.user._id);
        const typingUsers = Array.from(typingMap.values())
            .filter((entry) => String(entry.userID) !== currentUserKey)
            .map((entry) => ({
                userID: entry.userID,
                email: entry.email,
                displayName: entry.displayName,
            }));

        return res.status(200).json({
            success: true,
            message: "Typing status fetched",
            data: typingUsers,
        });
    } catch (error) {
        logger.error("Get chat typing status failed", {
            ...logCtx,
            groupID,
            error: getErrorMeta(error),
        });

        return res.status(500).json({
            success: false,
            message: "An error occurred while fetching typing status",
        });
    }
}

module.exports = {
    createChatMessage,
    getChatMessages,
    markChatMessagesAsRead,
    setChatTypingStatus,
    getChatTypingStatus,
};
