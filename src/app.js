const express = require("express");
const cors = require("cors");
const envConfig = require("./config/env.config");
const httpLoggerMiddleware = require("./middlewares/httpLogger.middleware");

// test route (optional)
const testRouter =
	envConfig.NODE_ENV === "development"
		? require("./routes/route.test")
		: null;

const authRouter = require("./routes/auth.route");

const app = express();

// middlewares
app.use(express.json());

const allowedOrigins = [
	"http://localhost:3000",
	"http://localhost:3001",
	"http://localhost:5000",
];

app.use(
	cors({
		origin: envConfig.CLIENT_URL || allowedOrigins,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
		credentials: true,
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);
app.use(express.json());

/**
 * Basic route to check if the server is running.
 */
app.get("/health", (req, res) => {
	res.status(200).json({
		success: true,
		message: "OK",
	});
});

module.exports = app;