const express = require("express");
const router = express.Router();

const {
  createMeal,
  getMeals,
  updateMeal,
  deleteMeal,
  getMealSummary,
} = require("../controllers/meal.controller");

const authMiddleware = require("../middlewares/auth.middleware");


router.post("/", authMiddleware, createMeal);


router.get("/", authMiddleware, getMeals);


router.patch("/:id", authMiddleware, updateMeal);

