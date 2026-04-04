const express = require("express");

const expenseController = require("../controllers/expenses.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const multer = require("multer");
const uplode = multer({ storage: multer.memoryStorage() });

const expenseRouter = express.Router();

/**
 * - create a new expense
 * - POST /api/expenses
 * - protected route, requires valid Firebase ID token and group manager role
 * - expects multipart/form-data with fields: title, amount, category and file (receipt image)
 */
expenseRouter.post(
	"/",
	authMiddleware.authManagerMiddleware,
	uplode.single("file"),
	expenseController.createExpense,
);

/**
 * - get all expenses for the user's group
 * - GET /api/expenses?dateFrom=2026-04-01&dateTo=2026-04-30
 * - protected route, requires valid Firebase ID token and group membership
 */
expenseRouter.get(
	"/",
	authMiddleware.authUserMiddleware,
	expenseController.getExpenses,
);

module.exports = expenseRouter;
