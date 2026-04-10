const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
	groupID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "group",
		required: [true, "groupID is required for creating a payment entry"],
		immutable: [true, "groupID cannot be changed once set"],
	},
	userID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "user",
		required: [true, "userID is required for creating a payment entry"],
		immutable: [true, "userID cannot be changed once set"],
	},
	amount: {
		type: Number,
		required: [true, "amount is required for creating a payment entry"],
		min: [0, "amount cannot be negative"],
		immutable: [true, "amount cannot be changed once set"],
	},
	paymentMethod: {
		type: String,
		trim: true,
		default: "",
		immutable: [true, "paymentMethod cannot be changed once set"],
	},
	senderNumber: {
		type: String,
		trim: true,
		default: "",
		immutable: [true, "senderNumber cannot be changed once set"],
	},
	transactionID: {
		type: String,
		trim: true,
		default: "",
		immutable: [true, "transactionID cannot be changed once set"],
		unique: [
			true,
			"transactionID must be unique, a payment with this transactionID already exists",
		],
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
}, {
	timestamps: true,
});

const paymentModel = mongoose.model("payment", paymentSchema);

module.exports = paymentModel;
