const winston = require("winston");
require("winston-daily-rotate-file"); // Import the transport
const { combine, timestamp, json, errors } = winston.format;

const levels = {
	error: 0,
	warn: 1,
	http: 2,
	info: 3,
	debug: 4,
};

const level = () => {
	const env = process.env.NODE_ENV || "development";
	return env === "development" ? "debug" : "info";
};

const REDACTED = "[REDACTED]";
const REDACT_KEYS = new Set([
	"authorization",
	"password",
	"passwd",
	"pwd",
	"token",
	"accesstoken",
	"refreshtoken",
	"idtoken",
	"apikey",
	"api_key",
	"secret",
	"cookie",
	"set-cookie",
]);

function redactSensitive(value) {
	if (Array.isArray(value)) {
		for (let i = 0; i < value.length; i += 1) {
			value[i] = redactSensitive(value[i]);
		}
		return value;
	}

	if (!value || typeof value !== "object") {
		return value;
	}

	for (const [key, val] of Object.entries(value)) {
		const normalizedKey = key.toLowerCase().replace(/[\s_-]/g, "");

		if (REDACT_KEYS.has(normalizedKey)) {
			value[key] = REDACTED;
			continue;
		}

		value[key] = redactSensitive(val);
	}

	return value;
}

const redactSensitiveFormat = winston.format((info) => redactSensitive(info));

const logFormat = combine(
	errors({ stack: true }),
	redactSensitiveFormat(),
	timestamp(),
	json(),
);

// --- NEW: Configure File Transports ---

// 1. Transport for all logs (info and below)
const fileRotateTransport = new winston.transports.DailyRotateFile({
	filename: "logs/SBL-%DATE%.log", // Saves in a 'logs' folder
	datePattern: "YYYY-MM-DD", // Rotates daily
	zippedArchive: true, // Zips old logs to save space
	maxSize: "20m", // Rotates if the file hits 20 Megabytes
	maxFiles: "14d", // Keeps logs for 14 days, deletes older ones
});

// 2. Transport strictly for error logs
const errorFileRotateTransport = new winston.transports.DailyRotateFile({
	level: "error", // ONLY captures 'error' level
	filename: "logs/SBL-error-%DATE%.log",
	datePattern: "YYYY-MM-DD",
	zippedArchive: true,
	maxSize: "20m",
	maxFiles: "30d", // Keep error logs around a bit longer
});

// --- Create the Logger ---

const logger = winston.createLogger({
	level: level(),
	levels,
	format: logFormat,
	defaultMeta: { service: "smart-bachelor-life-server" },
	transports: [
		new winston.transports.Console(),
		fileRotateTransport,
		errorFileRotateTransport,
	],
});

function getLogContext(req) {
	return {
		requestId: req.id || req.requestId || req.headers["x-request-id"],
		method: req.method,
		path: req.originalUrl,
		ip: req.ip,
		userAgent: req.headers["user-agent"],
		userId: req.user?._id?.toString?.() || req.user?.id || req.user?.uid,
		userUid: req.user?.uid,
		userEmail: req.user?.email,
	};
}

function getErrorMeta(error) {
	return {
		name: error?.name,
		message: error?.message,
		stack: error?.stack,
	};
}

module.exports = {
	logger,
	getLogContext,
	getErrorMeta,
};
