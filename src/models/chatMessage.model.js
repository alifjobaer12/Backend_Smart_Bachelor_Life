const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
    {
        groupID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "group",
            required: [true, "groupID is required for chat message"],
        },
        userID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: [true, "userID is required for chat message"],
        },
        text: {
            type: String,
            trim: true,
            required: [true, "text is required for chat message"],
            maxlength: [2000, "text cannot exceed 2000 characters"],
        },
        readBy: {
            type: [
                {
                    userID: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "user",
                        required: true,
                    },
                    readAt: {
                        type: Date,
                        default: Date.now,
                    },
                },
            ],
            default: [],
        },
    },
    {
        timestamps: true,
    },
);

chatMessageSchema.index({ groupID: 1, createdAt: -1 });

const chatMessageModel = mongoose.model("chatMessage", chatMessageSchema);

module.exports = chatMessageModel;
