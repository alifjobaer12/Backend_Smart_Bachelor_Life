const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
	title: {
		type: String,
		trim: true,
		default: "",
		required: [true, "title is required for creating a group"],
	},
	address: {
		type: String,
		trim: true,
		default: "",
	},
	managerID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "user",
		required: [true, "managerID is required for creating a group"],
	},
	userIDs: {
		type: [mongoose.Schema.Types.ObjectId],
		ref: "user",
		default: [],
	},
	joinCode: {
		type: String,
		trim: true,
		default: "",
		required: [true, "joinCode is required for creating a group"],
	},
}, {
	timestamps: true,
})