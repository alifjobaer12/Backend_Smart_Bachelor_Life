const winston = require("winston");
require("winston-daily-rotate-file"); // Import the transport
const { combine, timestamp, json, printf, colorize, errors } = winston.format;

const levels = {
	error: 0,
	warn: 1,
	info: 2,
	http: 3,
	debug: 4,
};

const level = () => {
	const env = process.env.NODE_ENV || "development";
	return env === "development" ? "debug" : "info";
};

const developmentFormat = combine(
	colorize({ all: true }),
	timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
	printf((info) => `${info.timestamp} [${info.level}]: ${info.message}`),
);

const productionFormat = combine(timestamp(), errors({ stack: true }), json());

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
	format:
		process.env.NODE_ENV === "production"
			? productionFormat
			: developmentFormat,
	defaultMeta: { service: "your-service-name" },
	transports: [
		// Always log to the console
		new winston.transports.Console(),
		// Add the file transports
		fileRotateTransport,
		errorFileRotateTransport,
	],
});

function getLogContext(req) {
	return {
		requestId: req.id || req.headers["x-request-id"],
		method: req.method,
		path: req.originalUrl,
		ip: req.ip,
		userAgent: req.headers["user-agent"],
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
