const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
	groupID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "group",
		required: [true, "groupID is required for creating an expense entry"],
	},
	userID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "user",
		required: [true, "userID is required for creating an expense entry"],
	},
	title: {
		type: String,
		trim: true,
		default: "",
		required: [true, "title is required for creating an expense entry"],
	},
	amount: {
		type: Number,
		required: [true, "amount is required for creating an expense entry"],
		min: [0, "amount cannot be negative"],
	},
	category: {
		type: String,
		trim: true,
		default: "",
	},
	date: {
		type: Date,
		required: [true, "date is required for creating an expense entry"],
	},
	documentURL: {
		type: String,
		trim: true,
		default: "",
	},
}, {
	timestamps: true,
})

const expenseModel = mongoose.model("expense", expenseSchema);

module.exports = expenseModel;