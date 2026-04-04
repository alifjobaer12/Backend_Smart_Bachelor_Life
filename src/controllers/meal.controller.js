const Meal = require("../models/meal.model");
const User = require("../models/user.model");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

// Create Meal
exports.createMeal = async (req, res) => {
  const logCtx = getLogContext(req);
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      logger.warn("User not found in createMeal", logCtx);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { groupID, date, mealCount } = req.body;

    const meal = await Meal.create({
      userID: user._id,
      groupID,
      date,
      mealCount,
    });

    logger.info("Meal created", { ...logCtx, mealId: meal._id });
    res.status(201).json({ success: true, data: meal });
  } catch (error) {
    logger.error("Error creating meal", { ...logCtx, error: getErrorMeta(error) });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Meals
exports.getMeals = async (req, res) => {
  const logCtx = getLogContext(req);
  try {
    const { groupID, date } = req.query;

    const query = { groupID };
    if (date) query.date = date;

    const meals = await Meal.find(query).populate("userID", "displayName email");

    logger.info("Meals fetched", logCtx);
    res.status(200).json({ success: true, data: meals });
  } catch (error) {
    logger.error("Error fetching meals", { ...logCtx, error: getErrorMeta(error) });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update
exports.updateMeal = async (req, res) => {
  const logCtx = getLogContext(req);
  try {
    const meal = await Meal.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!meal) {
      logger.warn("Meal not found for update", logCtx);
      return res.status(404).json({ success: false, message: "Not found" });
    }

    logger.info("Meal updated", { ...logCtx, mealId: meal._id });
    res.json({ success: true, data: meal });
  } catch (error) {
    logger.error("Error updating meal", { ...logCtx, error: getErrorMeta(error) });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete
exports.deleteMeal = async (req, res) => {
  const logCtx = getLogContext(req);
  try {
    const meal = await Meal.findByIdAndDelete(req.params.id);

    if (!meal) {
      logger.warn("Meal not found for delete", logCtx);
      return res.status(404).json({ success: false });
    }

    logger.info("Meal deleted", { ...logCtx, mealId: meal._id });
    res.json({ success: true });
  } catch (error) {
    logger.error("Error deleting meal", { ...logCtx, error: getErrorMeta(error) });
    res.status(500).json({ success: false, error: error.message });
  }
};