const userModel = require("../models/user.model");
const groupModel = require("../models/group.model");

const emailService = require("../services/email.service");

const tokenBlackListModel = require("../models/tokenBlacklist.model");

const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

/**
 * - user registration controller
 * - POST /api/auth/register
 * - open to public
 */
async function userRegisterController(req, res) {
	const logCtx = getLogContext(req);
	const { firebaseUid, email, displayName, photoURL, provider, lastLoginAt } =
		req.body;

	logger.info("Auth register attempt", {
		...logCtx,
		firebaseUid,
		email,
		provider,
	});

	if (!firebaseUid || !email) {
		return res.status(400).json({
			success: false,
			message: "firebaseUid and email are required",
		});
	}

	try {
		const isExistingUser = await userModel.findOne({
			$or: [{ firebaseUid }, { email }],
		});

		if (isExistingUser) {
			logger.warn("Auth register rejected: user already exists", {
				...logCtx,
				firebaseUid,
				email,
				existingUserId: isExistingUser._id,
			});

			return res.status(422).json({
				success: false,
				message:
					"User with the provided firebaseUid or email already exists",
			});
		}

		const newUser = await userModel.create({
			firebaseUid,
			email,
			displayName,
			photoURL,
			provider,
			lastLoginAt,
		});

		logger.info("Auth register success", {
			...logCtx,
			userId: newUser._id,
			email: newUser.email,
		});

		res.status(201).json({
			success: true,
			message: "User registered successfully",
			user: newUser,
		});

		// async email, do not block response
		emailService
			.sendRegisreationEmail(email, displayName)
			.catch((error) => {
				logger.error("Registration email send failed", {
					...logCtx,
					email,
					error: getErrorMeta(error),
				});
			});
	} catch (error) {
		logger.error("Auth register failed", {
			...logCtx,
			email,
			firebaseUid,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while registering the user",
		});
	}
}

/**
 * - manager registration controller (promote existing user to manager)
 * - POST /api/auth/register-manager
 * - protected route, requires valid Firebase ID token and member role
 */
async function managerRegisterController(req, res) {
	const logCtx = getLogContext(req);

	try {
		const user = await userModel
			.findOne({ email: req.body.email })
			.select("+role +roleSelectionCompleted");

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		user.role = "MANAGER";
		user.roleSelectionCompleted = true;
		await user.save();

		logger.info("Manager role assigned successfully", {
			...logCtx,
			userId: user._id,
			email: user.email,
		});

		return res.status(200).json({
			success: true,
			message: "User promoted to manager successfully",
			user,
		});
	} catch (error) {
		logger.error("Error promoting user to manager", {
			...logCtx,
			email: req.body?.email,
			error: getErrorMeta(error),
		});
		return res.status(500).json({
			success: false,
			message: "An error occurred while promoting the user to manager",
		});
	}
}

/**
 * - user login controller
 * - POST /api/auth/login
 * - protected route, requires valid Firebase ID token
 */
async function userLoginController(req, res) {
	const logCtx = getLogContext(req);
	const email = req.user?.email;
	const uid = req.user?.firebaseUid;

	logger.info("Auth login attempt", { ...logCtx });

	if (!email) {
		logger.warn("Auth login rejected: missing email in token", {
			...logCtx,
		});
		return res.status(400).json({
			success: false,
			message: "Email is missing for login",
		});
	}

	try {
		const user = await userModel
			.findOne({
				$or: [{ firebaseUid: uid }, { email }],
			})
			.select("+role +roleSelectionCompleted");

		if (!user) {
			logger.warn("Auth login rejected: user not found", {
				...logCtx,
				email,
				uid,
			});
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		user.lastLoginAt = new Date();
		await user.save();

		const group = await groupModel
			.findOne({
				$or: [{ managerID: user._id }, { userIDs: user._id }],
			})
			.populate("managerID", "email displayName")
			.populate("userIDs", "email displayName");

		const currentGroup = group
			? {
				id: group._id,
				title: group.title,
				address: group.address,
				joinCode: group.joinCode,
				paymentNotice: group.paymentNotice || "",
				memberCount: group.userIDs?.length || 0,
				manager: group.managerID,
			}
			: null;

		logger.info("Auth login success", {
			...logCtx,
			userId: user._id,
			email: user.email,
		});

		return res.status(200).json({
			success: true,
			message: "User logged in successfully",
			user,
			currentGroup,
		});
	} catch (error) {
		logger.error("Auth login failed", {
			...logCtx,
			email,
			uid,
			error: getErrorMeta(error),
		});

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
	const logCtx = getLogContext(req);
	const authHeader = req.headers.authorization;
	const token = authHeader?.startsWith("Bearer ")
		? authHeader.split(" ")[1]
		: null;

	logger.info("Auth logout attempt", { ...logCtx });

	if (!token) {
		logger.warn("Auth logout skipped: no bearer token", { ...logCtx });
		return res.status(400).json({
			success: false,
			message: "Already logged out",
		});
	}

	try {
		await tokenBlackListModel.create({ token });

		logger.info("Auth logout success", {
			...logCtx,
			tokenPresent: true,
		});

		return res.status(200).json({
			success: true,
			message: "User logged out successfully",
		});
	} catch (error) {
		// Handle duplicate token blacklist insertion (if unique index exists)
		if (error?.code === 11000) {
			logger.warn("Auth logout duplicate blacklist entry", {
				...logCtx,
				error: getErrorMeta(error),
			});
			return res.status(200).json({
				success: true,
				message: "User logged out successfully",
			});
		}

		logger.error("Auth logout failed", {
			...logCtx,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while logging out the user",
		});
	}
}

module.exports = {
	userRegisterController,
	userLoginController,
	userLogoutController,
	managerRegisterController,
};
