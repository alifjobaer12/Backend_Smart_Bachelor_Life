const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
	groupID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "group",
		required: [true, "groupID is required for creating a menu"],
	},
	userID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "user",
		required: [true, "userID is required for creating a menu"],
	},
	date: {
		type: Date,
		required: [true, "date is required for creating a menu"],
	},
	breakfast: {
		type: String,
		trim: true,
		default: "",
	},
	lunch: {
		type: String,
		trim: true,
		default: "",
	},
	dinner: {
		type: String,
		trim: true,
		default: "",
	},
}, {
	timestamps: true,
})

const menuModel = mongoose.model("menu", menuSchema);

module.exports = menuModel;