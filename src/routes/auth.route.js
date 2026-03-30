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
 * - POST /api/auth/test-login
 * - test login route to verify authentication middleware
 * - protected route, requires valid Firebase ID token
 * - only enabled in non-production environments
 */
if (process.env.NODE_ENV !== "production") {
	authRouter.post(
		"/test-login",
		authMiddleware.authUserMiddleware,
		authController.testLoginController,
	);
}

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

module.exports = authRouter;
