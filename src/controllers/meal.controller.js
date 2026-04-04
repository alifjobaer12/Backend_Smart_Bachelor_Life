const Meal = require("../models/meal.model");

// async handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

//  Create Meal
exports.createMeal = asyncHandler(async (req, res) => {
  const userID = req.user.id; // from auth middleware
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
});

//  Get all meals (group-wise)
exports.getMeals = asyncHandler(async (req, res) => {
  const { groupID, date } = req.query;

  const query = { groupID };

  if (date) {
    query.date = date;
  }

  const meals = await Meal.find(query).populate("userID", "displayName email");

  res.status(200).json({
    success: true,
    data: meals,
  });
});

//  Update Meal
exports.updateMeal = asyncHandler(async (req, res) => {
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
});

//  Delete Meal
exports.deleteMeal = asyncHandler(async (req, res) => {
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
});


//  Group summary - total meals and total entries for a group
exports.getMealSummary = asyncHandler(async (req, res) => {
  const { groupID } = req.query;

  const meals = await Meal.find({ groupID });

  let totalMeals = 0;

  meals.forEach((m) => {
    totalMeals += m.mealCount;
  });

  res.status(200).json({
    success: true,
    data: {
      totalMeals,
      totalEntries: meals.length,
    },
  });
});