const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
	groupID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "group",
		required: [true, "groupID is required for creating a payment entry"],
	},
	userID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "user",
		required: [true, "userID is required for creating a payment entry"],
	},
	amount: {
		type: Number,
		required: [true, "amount is required for creating a payment entry"],
		min: [0, "amount cannot be negative"],
	},
	paymentMethod: {
		type: String,
		trim: true,
		default: "",
	},
	transactionID: {
		type: String,
		trim: true,
		default: "",
	},
	status: {
		type: String,
		trim: true,
		enum: {
			values: ["PENDING", "COMPLETED", "FAILED"],
			message:
				"Status must be either 'PENDING', 'COMPLETED', or 'FAILED'",
		},
		default: "PENDING",
	},
});

const paymentModel = mongoose.model("payment", paymentSchema);

module.exports = paymentModel;
