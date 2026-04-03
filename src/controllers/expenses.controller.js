const expenseModel = require("../models/expense.model");
const userModel = require("../models/user.model");
const groupModel = require("../models/group.model");

const storageService = require("../services/storage.service");

async function createExpense(req, res) {
	const { title, amount, category } = req.body;
	const file = req.file;

	if (!title || !amount || !category) {
		return res.status(400).json({
			success: false,
			message: "title, amount and category are required",
		});
	}

	if (!file) {
		return res.status(400).json({
			success: false,
			message: "file is required",
		});
	}

	const group = await groupModel.findOne({
		managerID: req.user._id,
	});

	if (!group) {
		return res.status(403).json({
			success: false,
			message: "Only group managers can create expense entries",
		});
	}

	const documentURL = await storageService.uplodeFile(
		"expenses",
		`expenses_${category}_${group._id}`,
		file,
	);

	if (!documentURL) {
		return res.status(500).json({
			success: false,
			message: "Failed to upload document",
		});
	}

	const newExpense = await expenseModel.create({
		groupID: group._id,
		userID: req.user._id,
		title,
		amount,
		category,
		documentURL: documentURL.url,
	});

	return res.status(201).json({
		success: true,
		message: "Expense entry created successfully",
		expense: newExpense,
	});
}

module.exports = {
	createExpense,
};
