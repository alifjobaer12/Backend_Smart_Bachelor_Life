const express = require("express");

const expenseController = require("../controllers/expenses.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const multer = require("multer");
const uplode = multer({ storage: multer.memoryStorage() });

const expenseRouter = express.Router();

expenseRouter.post(
	"/",
	authMiddleware.authManagerMiddleware,
	uplode.single("file"),
	expenseController.createExpense,
);

expenseRouter.get(
	"/",
	authMiddleware.authUserMiddleware,
	expenseController.getExpenses,
);

module.exports = expenseRouter;
