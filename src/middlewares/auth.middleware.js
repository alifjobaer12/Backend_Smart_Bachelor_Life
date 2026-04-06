const firebaseAdmin = require("../config/firebase.config");

const tokenBlackListModel = require("../models/tokenBlackList.model");
const userModel = require("../models/user.model");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

/**
 * 	Middleware to authenticate users using Firebase ID tokens.
 * - Checks for the presence of an Authorization header with a Bearer token.
 * - Verifies the token using Firebase Admin SDK.
 * - If valid, attaches the decoded token (user info) to req.user and calls next().
 * - Also checks if the token is blacklisted (e.g., after logout) and denies access if it is.
 */
async function authUserMiddleware(req, res, next) {
	const logCtx = getLogContext(req);
	const authHeader = req.headers.authorization;
	const token = authHeader?.startsWith("Bearer ")
		? authHeader.split(" ")[1]
		: null;

	logger.info("Auth user middleware attempt", {
		...logCtx,
		hasAuthHeader: !!authHeader,
	});

	if (!token) {
		logger.warn("Auth user middleware failed: missing bearer token", {
			...logCtx,
		});

		return res.status(401).json({
			success: false,
			message: "Authorization token is missing",
		});
	}

	try {
		const isTokenBlacklisted = await tokenBlackListModel.findOne({
			token,
		});

		if (isTokenBlacklisted) {
			logger.warn("Auth user middleware failed: token blacklisted", {
				...logCtx,
			});

			return res.status(401).json({
				success: false,
				message: "Unauthorized, token is blacklisted",
			});
		}

		const decoded = await firebaseAdmin.auth().verifyIdToken(token);

		const user = await userModel.findOne({
			$or: [{ firebaseUid: decoded.uid }, { email: decoded.email }],
		});

		if (!user) {
			logger.warn("Auth user middleware failed: user not found", {
				...logCtx,
				firebaseUid: decoded.uid,
				email: decoded.email,
			});

			return res.status(401).json({
				success: false,
				message: "Unauthorized, user not found",
			});
		}

		req.user = user;

		logger.info("Auth user middleware success", {
			...logCtx,
			userId: user._id,
			email: user.email,
		});

		next();
	} catch (error) {
		logger.error("Auth user middleware failed", {
			...logCtx,
			error: getErrorMeta(error),
		});

		return res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
}

/**
 * Middleware to authenticate manager users using Firebase ID tokens.
 * - If the token is valid and the user is a manager, attaches the decoded token to req.user and calls next().
 * - Also checks if the token is blacklisted and denies access if it is.
 */
async function authManagerMiddleware(req, res, next) {
	const logCtx = getLogContext(req);
	const authHeader = req.headers.authorization;
	const token = authHeader?.startsWith("Bearer ")
		? authHeader.split(" ")[1]
		: null;

	logger.info("Auth manager middleware attempt", {
		...logCtx,
		hasAuthHeader: !!authHeader,
	});

	if (!token) {
		logger.warn("Auth manager middleware failed: missing bearer token", {
			...logCtx,
		});

		return res.status(401).json({
			success: false,
			message: "Authorization token is missing",
		});
	}

	try {
		const isTokenBlacklisted = await tokenBlackListModel.findOne({
			token,
		});

		if (isTokenBlacklisted) {
			logger.warn("Auth manager middleware failed: token blacklisted", {
				...logCtx,
			});

			return res.status(401).json({
				success: false,
				message: "Unauthorized, token is blacklisted",
			});
		}

		const decoded = await firebaseAdmin.auth().verifyIdToken(token);

		const isManager = await userModel.findOne({
			$or: [{ firebaseUid: decoded.uid }, { email: decoded.email }],
			role: "MANAGER",
		});

		if (!isManager) {
			logger.warn("Auth manager middleware failed: not a manager", {
				...logCtx,
				firebaseUid: decoded.uid,
				email: decoded.email,
			});

			return res.status(403).json({
				success: false,
				message: "Forbidden, user is not a manager",
			});
		}

		req.user = isManager;

		logger.info("Auth manager middleware success", {
			...logCtx,
			userId: isManager._id,
			email: isManager.email,
		});

		next();
	} catch (error) {
		logger.error("Auth manager middleware failed", {
			...logCtx,
			error: getErrorMeta(error),
		});

		return res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
}

module.exports = {
	authUserMiddleware,
	authManagerMiddleware,
};
