const mongoose = require("mongoose");

const bazarSchema = new mongoose.Schema({
	groupID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "group",
		required: [true, "groupID is required for creating a bazar entry"],
	},
	userID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "user",
		required: [true, "userID is required for creating a bazar entry"],
	},
	date: {
		type: Date,
		required: [true, "date is required for creating a bazar entry"],
	},
	item: {
		type: [String],
		default: [],
	},
	quantity: {
		type: [Number],
		default: [],
	},
	price: {
		type: [Number],
		default: [],
	},
	documentURL: {
		type: String,
		trim: true,
		default: "",
		required: [true, "documentURL is required for creating a bazar entry"],
	},
}, {
	timestamps: true,
})

const bazarModel = mongoose.model("bazar", bazarSchema);

module.exports = bazarModel;