const userModel = require("../models/user.model");

const emailService = require("../services/email.service");

const tokenBlackListModel = require("../models/tokenBlacklist.model");

/**
 * - user registration controller
 * - POST /api/auth/register
 * - open to public
 */
async function userRegisterController(req, res) {
	const {
		firebaseUid,
		email,
		displayName,
		photoURL,
		role,
		provider,
		lastLoginAt,
	} = req.body;

	const isExistingUser = await userModel.findOne({
		$or: [{ firebaseUid }, { email }],
	});

	if (isExistingUser) {
		return res.status(422).json({
			success: false,
			message:
				"User with the provided firebaseUid or email already exists",
		});
	}

	try {
		// Create a new user document in MongoDB
		const newUser = await userModel.create({
			firebaseUid,
			email,
			displayName,
			photoURL,
			role,
			provider,
			lastLoginAt,
		});

		res.status(201).json({
			success: true,
			message: "User registered successfully",
			user: newUser,
		});

		// Send a welcome email to the new user
		emailService.sendRegisreationEmail(email, displayName);
	} catch (error) {
		console.error("Error registering user:", error);
		return res.status(500).json({
			success: false,
			message: "An error occurred while registering the user",
		});
	}
}

/**
 * - user login controller
 * - POST /api/auth/login
 * - protected route, requires valid Firebase ID token
 */
async function userLoginController(req, res) {
	const { email } = req.user;

	if (!email) {
		return res.status(400).json({
			success: false,
			message: "Email is missing for login",
		});
	}

	if (email !== req.user.email) {
		return res.status(401).json({
			success: false,
			message: "Unauthorized: Email mismatch",
		});
	}

	const user = await userModel.findOne({
		$or: [{ firebaseUid: req.user.uid }, { email: req.user.email }],
	});

	if (!user) {
		return res.status(404).json({
			success: false,
			message: "User not found",
		});
	}

	try {
		user.lastLoginAt = new Date();
		await user.save();
		return res.status(200).json({
			success: true,
			message: "User logged in successfully",
			user,
		});
	} catch (error) {
		console.error("Error logging in user:", error);
		return res.status(500).json({
			success: false,
			message: "An error occurred while logging in the user",
		});
	}
}

/**
 * - user logout controller
 * - POST /api/auth/logout
 * - protected route, requires valid Firebase ID token
 * - blacklists the token to prevent further use
 */
async function userLogoutController(req, res) {
	const token = req.headers.authorization?.split(" ")[1];

	if (!token) {
		return res.status(400).json({
			success: false,
			message: "Already logged out",
		});
	}

	await tokenBlackListModel.create({
		token,
	});

	res.status(200).json({
		success: true,
		message: "User logged out successfully",
	});
}

module.exports = {
	userRegisterController,
	userLoginController,
	userLogoutController,
};
