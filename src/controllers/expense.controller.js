const Expense = require("../models/expense.model");
const User = require("../models/user.model");

exports.createExpense = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    const expense = await Expense.create({
      userID: user._id,
      ...req.body,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find(req.query).populate("userID", "displayName email");
    res.json({ success: true, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};