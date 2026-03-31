const mongoose = require("mongoose");

const tokenBlackListSchema = new mongoose.Schema(
	{
		token: {
			type: String,
			required: [
				true,
				"Token is required for creating a black list entry",
			],
			immutable: true,
		},
	},
	{
		timestamps: true,
	},
);

// Create an index on the createdAt field to automatically delete expired tokens after 3 days
tokenBlackListSchema.index(
	{ createdAt: 1 },
	{ expireAfterSeconds: 60 * 60 * 24 * 3 },
);

const tokenBlackListModel = mongoose.model("tokenBlackList", tokenBlackListSchema);

module.exports = tokenBlackListModel;
