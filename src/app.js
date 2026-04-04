const express = require("express");
const cors = require("cors");
const envConfig = require("./config/env.config");
const httpLoggerMiddleware = require("./middlewares/httpLogger.middleware");

/**
 * 	Routes Requires
 * - test routes
 * - auth routes
 * - expenses routes
 * - group routes
 */
const testRouter =
	envConfig.NODE_ENV === "development"
		? require("./routes/route.test")
		: null;
const authRouter = require("./routes/auth.route");
const expensesRouter = require("./routes/expenses.route");
const groupRouter = require("./routes/group.route");

// Create an Express application
const app = express();

const allowedOrigins = [
	"http://localhost:3000",
	"http://localhost:3001",
	"http://localhost:5000",
];

// CORS configuration
app.use(
	cors({
		origin: envConfig.CLIENT_URL || allowedOrigins,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
		credentials: true,
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);
app.use(httpLoggerMiddleware);
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

/**
 * 	Routes Use
 * - test routes
 * - auth routes
 * - expenses routes
 * - group routes
 */
if (envConfig.NODE_ENV === "development" && testRouter) {
	app.use("/api/test", testRouter);
}
app.use("/api/auth", authRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/group", groupRouter);

module.exports = app;
