const express = require("express");
const router = express.Router();

const {
  createMeal,
  getMeals,
  updateMeal,
  deleteMeal,
 // getMealSummary,
} = require("../controllers/meal.controller");

const { authUserMiddleware } = require("../middlewares/auth.middleware");

/**
 * - create a new meal
 * - POST /api/meals
 * - protected route, requires valid Firebase ID token
 */
router.post("/", authUserMiddleware, createMeal);

/**
 * - get meals
 * - GET /api/meals
 * - protected route, requires valid Firebase ID token
 */
router.get("/", authUserMiddleware, getMeals);

/**
 * - update a meal
 * - PATCH /api/meals/:id
 * - protected route, requires valid Firebase ID token
 */
router.patch("/:id", authUserMiddleware, updateMeal);

/**
 * - delete a meal
 * - DELETE /api/meals/:id
 * - protected route, requires valid Firebase ID token
 */
router.delete("/:id", authUserMiddleware, deleteMeal);

module.exports = router;