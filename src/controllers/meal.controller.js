const Meal = require("../models/meal.model");
const User = require("../models/user.model");

// Create Meal
exports.createMeal = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { groupID, date, mealCount } = req.body;

    const meal = await Meal.create({
      userID: user._id,
      groupID,
      date,
      mealCount,
    });

    res.status(201).json({ success: true, data: meal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Meals
exports.getMeals = async (req, res) => {
  try {
    const { groupID, date } = req.query;

    const query = { groupID };
    if (date) query.date = date;

    const meals = await Meal.find(query).populate("userID", "displayName email");

    res.status(200).json({ success: true, data: meals });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update
exports.updateMeal = async (req, res) => {
  try {
    const meal = await Meal.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!meal) return res.status(404).json({ success: false, message: "Not found" });

    res.json({ success: true, data: meal });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete
exports.deleteMeal = async (req, res) => {
  try {
    const meal = await Meal.findByIdAndDelete(req.params.id);

    if (!meal) return res.status(404).json({ success: false });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};