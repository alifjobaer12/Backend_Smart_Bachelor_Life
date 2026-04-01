const mongoose = require("mongoose");

const mealSchema = new mongoose.Schema({
	groupID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "group",
		required: [true, "groupID is required for creating a meal"],
	},
	userID: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "user",
		required: [true, "userID is required for creating a meal"],
	},
	date: {
		type: Date,
		required: [true, "date is required for creating a meal"],

	},
	mealCount: {
		type: Number,
		required: [true, "mealCount is required for creating a meal"],
		min: [0, "mealCount cannot be negative"],
	},
}, {
	timestamps: true,
})

const mealModel = mongoose.model("meal", mealSchema);

module.exports = mealModel;