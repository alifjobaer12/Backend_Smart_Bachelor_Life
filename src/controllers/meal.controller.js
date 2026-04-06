const Meal = require("../models/meal.model");
const User = require("../models/user.model");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

//  CREATE MEAL
exports.createMeal = async (req, res) => {
  const logCtx = getLogContext(req);
  const { groupID, mealCount } = req.body;
  const date = new Date();

  logger.info("Create meal attempt", {
    ...logCtx,
    groupID,
    date,
    mealCount,
  });

  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    //  VALIDATION
    if (!groupID || mealCount === undefined) {
      return res.status(400).json({
        success: false,
        message: "groupID and mealCount are required",
      });
    }

    if (mealCount < 0) {
      return res.status(400).json({
        success: false,
        message: "mealCount cannot be negative",
      });
    }

    const meal = await Meal.create({
      userID: user._id,
      groupID,
      date,
      mealCount,
    });

    res.status(201).json({ success: true, data: meal });

  } catch (error) {
    logger.error("Error creating meal", {
      ...logCtx,
      error: getErrorMeta(error),
    });

    res.status(500).json({ 
      success: false,
      message: "An error occurred while creating the meal",
    });
  }
};



//  GET MEALS
exports.getMeals = async (req, res) => {
  const logCtx = getLogContext(req);
  const { groupID, date } = req.query;

  logger.info("Get meals attempt", {
    ...logCtx,
    groupID,
    date,
  });

  try {
    //  VALIDATION
    if (!groupID) {
      return res.status(400).json({
        success: false,
        message: "groupID query is required",
      });
    }

    const query = { groupID };

    //  Only filter date if user sends it
    if (date) {
      query.date = date;
    }

    const meals = await Meal.find(query)
      .populate("userID", "displayName email");

    res.status(200).json({ 
      success: true, 
      message: "Meals fetched successfully",
      data: meals });

  } catch (error) {
    logger.error("Error fetching meals", {
      ...logCtx,
      error: getErrorMeta(error),
    });

    res.status(500).json({ 
      success: false, 
      message: "An error occurred while fetching meals"
    });
  }
};



//  UPDATE MEAL
exports.updateMeal = async (req, res) => {
  const logCtx = getLogContext(req);

  logger.info("Update meal attempt", {
    ...logCtx,
    mealId: req.params.id,
    updates: req.body,
  });

  try {
    //  OPTIONAL VALIDATION
    if (req.body.mealCount !== undefined && req.body.mealCount < 0) {
      return res.status(400).json({
        success: false,
        message: "mealCount cannot be negative",
      });
    }

    const meal = await Meal.findByIdAndUpdate(
      req.params.id,
      { mealCount: req.body.mealCount }, //  controlled update
      { new: true }
    );

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: "Meal Not found",
      });
    }

    res.status(200).json({ success: true,
      message: "Meal updated successfully",
      data: meal 
    });

  } catch (error) {
    logger.error("Error updating meal", {
      ...logCtx,
      error: getErrorMeta(error),
    });

    res.status(500).json({ success: false, message: "An error occurred while updating the meal"  });
  }
};



//  DELETE MEAL
exports.deleteMeal = async (req, res) => {
  const logCtx = getLogContext(req);

  try {
    const meal = await Meal.findByIdAndDelete(req.params.id);

    if (!meal) {
      return res.status(404).json({ success: false, message: "Meal not found" });
    }

    res.status(200).json({ success: true, message: "Meal deleted successfully" });

  } catch (error) {
    logger.error("Error deleting meal", {
      ...logCtx,
      error: getErrorMeta(error),
    });

    res.status(500).json({ success: false, message: "An error occurred while deleting the meal" });
  }
};