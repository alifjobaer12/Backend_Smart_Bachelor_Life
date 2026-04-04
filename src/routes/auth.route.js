const express = require("express");

const authController = require("../controllers/auth.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const authRouter = express.Router();

/**
 * - POST /api/auth/register
 * - user registration
 * - open to public
 */
authRouter.post("/register", authController.userRegisterController);

/**
 * - POST /api/auth/manager-register
 * - user registration with manager role
 * - protected route, requires valid Firebase ID token
 */
authRouter.post(
	"/manager-register",
	authMiddleware.authUserMiddleware,
	authController.managerRegisterController,
);

/**
 * - POST /api/auth/login
 * - user login
 * - protected route, requires valid Firebase ID token
 */
authRouter.post(
	"/login",
	authMiddleware.authUserMiddleware,
	authController.userLoginController,
);

/**
 * - POST /api/auth/logout
 * - user logout
 * - protected route, requires valid Firebase ID token
 * - blacklists the token to prevent further use
 */
authRouter.post(
	"/logout",
	authMiddleware.authUserMiddleware,
	authController.userLogoutController,
);

module.exports = authRouter;
