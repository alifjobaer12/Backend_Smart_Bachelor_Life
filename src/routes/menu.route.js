const express = require("express");
const router = express.Router();

const {
  createMenu,
  getMenus,
  updateMenu,
  deleteMenu,
} = require("../controllers/menu.controller");

const {
  authUserMiddleware,
  authManagerMiddleware,
} = require("../middlewares/auth.middleware");

//  Create for manager only
router.post("/", authManagerMiddleware, createMenu);

//  Read for all users
router.get("/", authUserMiddleware, getMenus);

