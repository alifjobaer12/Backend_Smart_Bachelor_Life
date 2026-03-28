const express = require("express");

const authController = require("../controllers/auth.controller");

const authRouter = express.Router();

/**
 * - POST /api/auth/register
 * - user registration
 * - open to public
 */
authRouter.post("/register", authController.userRegisterController);


module.exports = authRouter;