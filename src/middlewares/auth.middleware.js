const firebaseAdmin = require("../config/firebase.config");

const tokenBlackListModel = require("../models/tokenBlacklist.model");

/**
 * 	Middleware to authenticate users using Firebase ID tokens.
 * - Checks for the presence of an Authorization header with a Bearer token.
 * - Verifies the token using Firebase Admin SDK.
 * - If valid, attaches the decoded token (user info) to req.user and calls next().
 * - If invalid or missing, responds with 401 Unauthorized.
 * - Also checks if the token is blacklisted (e.g., after logout) and denies access if it is.
 */
async function authUserMiddleware(req, res, next) {

	const token = req.headers.authorization?.split(" ")[1];

	if (!token) {
		return res.status(401).json({
			success: false,
			message: "Authorization token is missing",
		});
	}

	const isTokenBlacklisted = await tokenBlackListModel.findOne({
		token,
	});

	if (isTokenBlacklisted) {
		return res.status(401).json({
			success: false,
			message: "Unauthorized, token is blacklisted",
		});
	}

	try {
		const decoded = await firebaseAdmin.auth().verifyIdToken(token);
		req.user = decoded;
		next();

	} catch (error) {
		console.error("Authentication error:", error);
		return res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
}

module.exports = {
	authUserMiddleware,
};