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

/**
 * - create a new menu
 * - POST /api/menus
 * - protected route, requires valid Firebase ID token and group manager role
 */
router.post("/", authManagerMiddleware, createMenu);

/**
 * - get menus
 * - GET /api/menus
 * - protected route, requires valid Firebase ID token
 */
router.get("/", authUserMiddleware, getMenus);

/**
 * - update a menu
 * - PATCH /api/menus/:id
 * - protected route, requires valid Firebase ID token and group manager role
 */
router.patch("/:id", authManagerMiddleware, updateMenu);

/**
 * - delete a menu
 * - DELETE /api/menus/:id
 * - protected route, requires valid Firebase ID token and group manager role
 */
router.delete("/:id", authManagerMiddleware, deleteMenu);

module.exports = router;