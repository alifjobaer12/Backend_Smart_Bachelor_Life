const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");

const securityHeadersMiddleware = helmet({
	crossOriginResourcePolicy: { policy: "cross-origin" },
});

const authSensitiveLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 20,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	message: {
		success: false,
		message: "Too many requests. Please try again in a minute.",
	},
});

const globalApiLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 100,
	standardHeaders: "draft-8",
	legacyHeaders: false,
	skip: (req) => req.path.startsWith("/api/auth"),
	message: {
		success: false,
		message: "Too many requests. Please try again in a minute.",
	},
});

module.exports = {
	securityHeadersMiddleware,
	authSensitiveLimiter,
	globalApiLimiter,
};
