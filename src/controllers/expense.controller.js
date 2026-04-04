const Expense = require("../models/expense.model");

//  Create Expense
exports.createExpense = async (req, res) => {
  try {
    const userID = req.user.uid;
    const { groupID, title, amount, category, date, documentURL } = req.body;

    const expense = await Expense.create({
      userID,
      groupID,
      title,
      amount,
      category,
      date,
      documentURL,
    });

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create expense",
      error: error.message,
    });
  }
};

//  Get Expenses
exports.getExpenses = async (req, res) => {
  try {
    const { groupID, date, category } = req.query;

    const query = { groupID };

    if (date) query.date = date;
    if (category) query.category = category;

    const expenses = await Expense.find(query).populate(
      "userID",
      "displayName email"
    );

    res.status(200).json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch expenses",
      error: error.message,
    });
  }
};

//  Update Expense
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, category, date, documentURL } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      id,
      { title, amount, category, date, documentURL },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update expense",
      error: error.message,
    });
  }
};

//  Delete Expense
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByIdAndDelete(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: "Expense not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete expense",
      error: error.message,
    });
  }
};

//  Summary (total expense)
exports.getExpenseSummary = async (req, res) => {
  try {
    const { groupID } = req.query;

    const expenses = await Expense.find({ groupID });

    let totalExpense = 0;

    expenses.forEach((e) => {
      totalExpense += e.amount;
    });

    res.status(200).json({
      success: true,
      data: {
        totalExpense,
        totalEntries: expenses.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to calculate expense summary",
      error: error.message,
    });
  }
};