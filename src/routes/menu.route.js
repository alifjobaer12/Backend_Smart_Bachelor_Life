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
const cacheMiddleware = require("../middlewares/cache.middleware");

/**
 * - create a new menu
 * - POST /api/menus
 * - protected route, requires valid Firebase ID token and group manager role
 */
router.post(
	"/",
	authManagerMiddleware,
	cacheMiddleware.invalidateCache(["menu"]),
	createMenu,
);

/**
 * - get menus
 * - GET /api/menus
 * - protected route, requires valid Firebase ID token
 */
router.get(
	"/",
	authUserMiddleware,
	cacheMiddleware.getFromCache("menu", 120),
	getMenus,
);

/**
 * - update a menu
 * - PATCH /api/menus/:id
 * - protected route, requires valid Firebase ID token and group manager role
 */
router.patch(
	"/:id",
	authManagerMiddleware,
	cacheMiddleware.invalidateCache(["menu"]),
	updateMenu,
);

/**
 * - delete a menu
 * - DELETE /api/menus/:id
 * - protected route, requires valid Firebase ID token and group manager role
 */
router.delete(
	"/:id",
	authManagerMiddleware,
	cacheMiddleware.invalidateCache(["menu"]),
	deleteMenu,
);

module.exports = router;
