const express = require("express");
const router = express.Router();

const {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} = require("../controllers/expense.controller");

const {
  authUserMiddleware,
  authManagerMiddleware,
} = require("../middlewares/auth.middleware");

//  Create (manager)
router.post("/", authManagerMiddleware, createExpense);
const express = require("express");
const router = express.Router();

const {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} = require("../controllers/expense.controller");

const {
  authUserMiddleware,
  authManagerMiddleware,
} = require("../middlewares/auth.middleware");

//  Create (manager)
router.post("/", authManagerMiddleware, createExpense);

//  Read (all users)
router.get("/", authUserMiddleware, getExpenses);

//  Update (manager)
router.patch("/:id", authManagerMiddleware, updateExpense);

//  Delete (manager)
router.delete("/:id", authManagerMiddleware, deleteExpense);

//  Summary
router.get("/summary", authUserMiddleware, getExpenseSummary);

module.exports = router;