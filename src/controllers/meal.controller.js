const Meal = require("../models/meal.model");
const User = require("../models/user.model");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

// Create Meal
exports.createMeal = async (req, res) => {
  const logCtx = getLogContext(req);
  const { groupID, date, mealCount } = req.body;

  logger.info("Create meal attempt", {
    ...logCtx,
    groupID,
    date,
    mealCount,
  });

  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });

    if (!user) {
      logger.warn("User not found in createMeal", logCtx);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const meal = await Meal.create({
      userID: user._id,
      groupID,
      date: date || new Date(),
      mealCount,
    });

    logger.info("Meal created", { ...logCtx, mealId: meal._id, userId: user._id });
    res.status(201).json({ success: true, data: meal });
  } catch (error) {
    logger.error("Error creating meal", { ...logCtx, groupID, date, mealCount, error: getErrorMeta(error) });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get Meals
exports.getMeals = async (req, res) => {
  const logCtx = getLogContext(req);
  const { groupID, date } = req.query;

  logger.info("Get meals attempt", {
    ...logCtx,
    groupID,
    date,
  });

  try {

    const query = { groupID };
    if (date) query.date = date;

    const meals = await Meal.find(query).populate("userID", "displayName email");

    logger.info("Meals fetched", { ...logCtx, count: meals.length });
    res.status(200).json({ success: true, data: meals });
  } catch (error) {
    logger.error("Error fetching meals", { ...logCtx, groupID, date, error: getErrorMeta(error) });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update
exports.updateMeal = async (req, res) => {
  const logCtx = getLogContext(req);

  logger.info("Update meal attempt", {
    ...logCtx,
    mealId: req.params.id,
    updates: req.body,
  });

  try {
    const meal = await Meal.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!meal) {
      logger.warn("Meal not found for update", logCtx);
      return res.status(404).json({ success: false, message: "Not found" });
    }

    logger.info("Meal updated", { ...logCtx, mealId: meal._id });
    res.json({ success: true, data: meal });
  } catch (error) {
    logger.error("Error updating meal", { ...logCtx, mealId: req.params.id, updates: req.body, error: getErrorMeta(error) });
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete
exports.deleteMeal = async (req, res) => {
  const logCtx = getLogContext(req);

  logger.info("Delete meal attempt", {
    ...logCtx,
    mealId: req.params.id,
  });

  try {
    const meal = await Meal.findByIdAndDelete(req.params.id);

    if (!meal) {
      logger.warn("Meal not found for delete", logCtx);
      return res.status(404).json({ success: false });
    }

    logger.info("Meal deleted", { ...logCtx, mealId: meal._id });
    res.json({ success: true });
  } catch (error) {
    logger.error("Error deleting meal", { ...logCtx, mealId: req.params.id, error: getErrorMeta(error) });
    res.status(500).json({ success: false, error: error.message });
  }
};

