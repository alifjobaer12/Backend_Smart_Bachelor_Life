const { randomUUID } = require("crypto");
const { logger } = require("../utils/logger.util");

function httpLoggerMiddleware(req, res, next) {
	const requestId = req.headers["x-request-id"] || randomUUID();
	req.id = requestId;
	req.requestId = requestId;
	res.setHeader("x-request-id", requestId);

	const startedAt = Date.now();

	res.on("finish", () => {
		logger.http("HTTP request", {
			method: req.method,
			path: req.originalUrl,
			status: res.statusCode,
			responseTime: Date.now() - startedAt,
			ip: req.ip,
			userId:
				req.user?._id?.toString?.() || req.user?.id || req.user?.uid,
			requestId,
		});
	});

	next();
}

module.exports = httpLoggerMiddleware;