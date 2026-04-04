const express = require("express");
const router = express.Router();

const {
  createMeal,
  getMeals,
  updateMeal,
  deleteMeal,
  getMealSummary,
} = require("../controllers/meal.controller");

const { authUserMiddleware } = require("../middlewares/auth.middleware");


router.post("/", authUserMiddleware, createMeal);
router.get("/", authUserMiddleware, getMeals);
router.patch("/:id", authUserMiddleware, updateMeal);
router.delete("/:id", authUserMiddleware, deleteMeal);

module.exports = router;