const express = require("express");
const router = express.Router();

const {
	createMeal,
	getMeals,
	updateMeal,
	deleteMeal,
} = require("../controllers/meal.controller");

const { authUserMiddleware } = require("../middlewares/auth.middleware");
const cacheMiddleware = require("../middlewares/cache.middleware");

/**
 * - create a new meal
 * - POST /api/meals
 * - protected route, requires valid Firebase ID token
 */
router.post(
	"/",
	authUserMiddleware,
	cacheMiddleware.invalidateCache(["meal"]),
	createMeal,
);

/**
 * - get meals
 * - GET /api/meals
 * - protected route, requires valid Firebase ID token
 */
router.get(
	"/",
	authUserMiddleware,
	cacheMiddleware.getFromCache("meal", 120),
	getMeals,
);

/**
 * - update a meal
 * - PATCH /api/meals/:id
 * - protected route, requires valid Firebase ID token
 */
router.patch(
	"/:id",
	authUserMiddleware,
	cacheMiddleware.invalidateCache(["meal"]),
	updateMeal,
);

/**
 * - delete a meal
 * - DELETE /api/meals/:id
 * - protected route, requires valid Firebase ID token
 */
router.delete(
	"/:id",
	authUserMiddleware,
	cacheMiddleware.invalidateCache(["meal"]),
	deleteMeal,
);

module.exports = router;
