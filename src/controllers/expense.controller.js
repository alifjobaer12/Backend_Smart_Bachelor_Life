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
