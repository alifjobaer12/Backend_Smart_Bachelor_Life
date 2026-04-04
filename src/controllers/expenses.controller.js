const expenseModel = require("../models/expense.model");
const groupModel = require("../models/group.model");

const storageService = require("../services/storage.service");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

/**
 * Create a new expense entry
 * POST /api/expenses
 * Protected route, requires valid Firebase ID token and group manager role
 */
async function createExpense(req, res) {
	const logCtx = getLogContext(req);
	const { title, amount, category } = req.body;
	const file = req.file;

	logger.info("Create expense attempt", {
		...logCtx,
		title,
		category,
		amount,
		hasFile: !!file,
	});

	if (!title || !amount || !category) {
		logger.warn("Create expense failed: missing required fields", {
			...logCtx,
			title,
			amount,
			category,
		});

		return res.status(400).json({
			success: false,
			message: "title, amount and category are required",
		});
	}

	if (!file) {
		logger.warn("Create expense failed: no file uploaded", {
			...logCtx,
			title,
			category,
		});

		return res.status(400).json({
			success: false,
			message: "file is required",
		});
	}

	try {
		const group = await groupModel.findOne({
			managerID: req.user._id,
		});

		if (!group) {
			logger.warn("Create expense failed: user not group manager", {
				...logCtx,
				userId: req.user._id,
			});

			return res.status(403).json({
				success: false,
				message: "Only group managers can create expense entries",
			});
		}

		logger.debug("Uploading expense document", {
			...logCtx,
			groupId: group._id,
			category,
			fileName: file.originalname,
		});

		const documentURL = await storageService.uplodeFile(
			"expenses",
			`expenses_${category}_${group._id}`,
			file,
		);

		if (!documentURL) {
			logger.error("Expense document upload failed", {
				...logCtx,
				groupId: group._id,
				category,
				fileName: file.originalname,
			});

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

		logger.info("Create expense success", {
			...logCtx,
			expenseId: newExpense._id,
			groupId: group._id,
			amount,
			category,
		});

		return res.status(201).json({
			success: true,
			message: "Expense entry created successfully",
			expense: newExpense,
		});
	} catch (error) {
		logger.error("Create expense failed", {
			...logCtx,
			title,
			category,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while creating the expense entry",
		});
	}
}

/**
 * Get expense entries for the user's group
 * GET /api/expenses?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
 * Protected route, requires valid Firebase ID token and group membership
 */
async function getExpenses(req, res) {
	const logCtx = getLogContext(req);
	const { dateFrom, dateTo } = req.query;

	logger.info("Get expenses attempt", {
		...logCtx,
		dateFrom,
		dateTo,
	});

	const isValidDate = (date) => !isNaN(new Date(date));

	if (dateFrom && !isValidDate(dateFrom)) {
		logger.warn("Get expenses failed: invalid dateFrom", {
			...logCtx,
			dateFrom,
		});

		return res.status(400).json({
			success: false,
			message: "Invalid dateFrom",
		});
	}

	if (dateTo && !isValidDate(dateTo)) {
		logger.warn("Get expenses failed: invalid dateTo", {
			...logCtx,
			dateTo,
		});

		return res.status(400).json({
			success: false,
			message: "Invalid dateTo",
		});
	}

	try {
		const group = await groupModel.findOne({
			$or: [{ managerID: req.user._id }, { userIDs: req.user._id }],
		});

		if (!group) {
			logger.warn("Get expenses failed: not authorized", {
				...logCtx,
				userId: req.user._id,
			});

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

			logger.debug("Get expenses using current month", {
				...logCtx,
				groupId: group._id,
				fromDate,
				toDate,
			});
		} else {
			fromDate = dateFrom ? new Date(dateFrom) : new Date(0);
			toDate = dateTo ? new Date(dateTo) : new Date();

			toDate.setHours(23, 59, 59, 999);

			logger.debug("Get expenses with custom date range", {
				...logCtx,
				groupId: group._id,
				fromDate,
				toDate,
			});
		}

		const expenses = await expenseModel
			.find({
				groupID: group._id,
				createdAt: { $gte: fromDate, $lte: toDate },
			})
			.populate("userID", "displayName email")
			.sort({ createdAt: -1 })
			.limit(50);

		logger.info("Get expenses success", {
			...logCtx,
			groupId: group._id,
			expenseCount: expenses.length,
			dateRange: { from: fromDate, to: toDate },
		});

		return res.status(200).json({
			success: true,
			message: "Expenses retrieved successfully",
			expenses,
		});
	} catch (error) {
		logger.error("Get expenses failed", {
			...logCtx,
			dateFrom,
			dateTo,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while retrieving expenses",
		});
	}
}

module.exports = {
	createExpense,
	getExpenses,
};
