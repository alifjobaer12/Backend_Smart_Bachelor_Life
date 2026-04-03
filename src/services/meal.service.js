const Meal = require("../models/meal.model");

// Create or Update Meal
const upsertMealService = async (data) => {
  const { userId, groupId, date, breakfast, lunch, dinner } = data;

  const totalMeal = (breakfast || 0) + (lunch || 0) + (dinner || 0);

  const meal = await Meal.findOneAndUpdate(
    { userId, groupId, date },
    {
      breakfast,
      lunch,
      dinner,
      totalMeal,
    },
    { new: true, upsert: true }
  );

  return meal;
};

// Get meals by group + optional date
const getMealsService = async (groupId, date) => {
  const query = { groupId };

  if (date) query.date = date;

  return await Meal.find(query).populate("userId", "displayName email");
};
// Delete meal by id
const deleteMealService = async (id) => {
  return await Meal.findByIdAndDelete(id);
};

// Group summary (important for expense)
const getMealSummaryService = async (groupId) => {
  const meals = await Meal.find({ groupId });

  let totalMeals = 0;

  meals.forEach((m) => {
    totalMeals += m.totalMeal;
  });

  return {
    totalMeals,
    totalEntries: meals.length,
  };
};

module.exports = {
  upsertMealService,
  getMealsService,
  deleteMealService,
  getMealSummaryService,
};