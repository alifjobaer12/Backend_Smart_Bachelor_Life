const express = require("express");
const router = express.Router();

const {
  createBazar,
  getBazar,
  updateBazar,
  deleteBazar,
  getBazarSummary,
} = require("../controllers/bazar.controller");

const {
  authUserMiddleware,
  authManagerMiddleware,
} = require("../middlewares/auth.middleware");

//  Create (manager)
router.post("/", authManagerMiddleware, createBazar);

//  Read (all users)
router.get("/", authUserMiddleware, getBazar);

//  Update (manager)
router.patch("/:id", authManagerMiddleware, updateBazar);

