const Meal = require("../models/meal.model");

// Create Meal
exports.createMeal = async (req, res) => {
  try {
    const userID = req.user.uid;
    const { groupID, date, mealCount } = req.body;

    const meal = await Meal.create({
      userID,
      groupID,
      date,
      mealCount,
    });

    res.status(201).json({
      success: true,
      message: "Meal created successfully",
      data: meal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create meal",
      error: error.message,
    });
  }
};

// Get Meals
exports.getMeals = async (req, res) => {
  try {
    const { groupID, date } = req.query;

    const query = { groupID };
    if (date) query.date = date;

    const meals = await Meal.find(query).populate("userID", "displayName email");

    res.status(200).json({
      success: true,
      data: meals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch meals",
      error: error.message,
    });
  }
};

// Update Meal
exports.updateMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const { mealCount } = req.body;

    const meal = await Meal.findByIdAndUpdate(
      id,
      { mealCount },
      { new: true }
    );

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: "Meal not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Meal updated successfully",
      data: meal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update meal",
      error: error.message,
    });
  }
};

// Delete Meal
exports.deleteMeal = async (req, res) => {
  try {
    const { id } = req.params;

    const meal = await Meal.findByIdAndDelete(id);

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: "Meal not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Meal deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete meal",
      error: error.message,
    });
  }
};