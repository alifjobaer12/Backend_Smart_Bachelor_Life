const expenseModel = require("../models/expense.model");
const userModel = require("../models/user.model");
const groupModel = require("../models/group.model");

const storageService = require("../services/storage.service");

/**
 * Create a new expense entry
 * POST /api/expenses
 * Protected route, requires valid Firebase ID token and group manager role
 */
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

/**
 * Get expense entries for the user's group
 * GET /api/expenses?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
 * Protected route, requires valid Firebase ID token and group membership
 */
async function getExpenses(req, res) {
	const { dateFrom, dateTo } = req.query;

	const isValidDate = (date) => !isNaN(new Date(date));

	if (dateFrom && !isValidDate(dateFrom)) {
		return res.status(400).json({
			success: false,
			message: "Invalid dateFrom",
		});
	}

	if (dateTo && !isValidDate(dateTo)) {
		return res.status(400).json({
			success: false,
			message: "Invalid dateTo",
		});
	}

	const group = await groupModel.findOne({
		$or: [{ managerID: req.user._id }, { userIDs: req.user._id }],
	});

	if (!group) {
		return res.status(403).json({
			success: false,
			message: "Not authorized to view expenses",
		});
	}

	let fromDate;
	let toDate;

	if (!dateFrom && !dateTo) {
		const now = new Date();
		fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
		toDate = new Date(
			now.getFullYear(),
			now.getMonth() + 1,
			0,
			23,
			59,
			59,
			999,
		);
	} else {
		fromDate = dateFrom ? new Date(dateFrom) : new Date(0);
		toDate = dateTo ? new Date(dateTo) : new Date();

		toDate.setHours(23, 59, 59, 999);
	}

	const expenses = await expenseModel
		.find({
			groupID: group._id,
			createdAt: { $gte: fromDate, $lte: toDate },
		})
		.populate("userID", "displayName email")
		.sort({ createdAt: -1 })
		.limit(50);

	return res.status(200).json({
		success: true,
		message: "Expenses retrieved successfully",
		expenses,
	});
}

module.exports = {
	createExpense,
	getExpenses,
};
