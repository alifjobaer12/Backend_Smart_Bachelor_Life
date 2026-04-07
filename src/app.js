const express = require("express");
const cors = require("cors");
const envConfig = require("./config/env.config");
const httpLoggerMiddleware = require("./middlewares/httpLogger.middleware");
const {
	swaggerUi,
	swaggerSpec,
	swaggerUiOptions,
} = require("./config/swagger.config");

/**
 * 	Routes Requires
 * - test routes
 * - auth routes
 * - expenses routes
 * - group routes
 * - payment routes
 * - meal routes
 * - menu routes
 * - bazar routes
 */
const testRouter =
	envConfig.NODE_ENV === "development"
		? require("./routes/route.test")
		: null;

const authRouter = require("./routes/auth.route");
const expensesRouter = require("./routes/expenses.route");
const groupRouter = require("./routes/group.route");
const paymentRouter = require("./routes/payment.route");
const mealRouter = require("./routes/meal.route");
const menuRouter = require("./routes/menu.route");
const bazarRouter = require("./routes/bazar.route");
const chatRouter = require("./routes/chat.route");

// Create an Express application
const app = express();

function getAllowedOrigins() {
	const defaults = [
		"http://localhost",
		"http://localhost:3000",
		"http://localhost:3001",
		"http://localhost:5173",
		"https://localhost",
		"capacitor://localhost",
		"ionic://localhost",
	];

	const configured = String(envConfig.CLIENT_URL || "")
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);

	return [...new Set([...defaults, ...configured])];
}

const allowedOrigins = getAllowedOrigins();

function isAllowedOrigin(origin) {
	if (!origin) {
		return true;
	}

	if (allowedOrigins.includes(origin)) {
		return true;
	}

	return /^https?:\/\/localhost(?::\d+)?$/i.test(origin);
}

const corsOptions = {
	origin(origin, callback) {
		if (isAllowedOrigin(origin)) {
			return callback(null, true);
		}

		return callback(new Error("Not allowed by CORS"));
	},
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	credentials: true,
	allowedHeaders: ["Content-Type", "Authorization"],
	optionsSuccessStatus: 204,
};

// CORS configuration & middleware
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
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
 * Swagger API documentation route
 * - serves the Swagger UI at /api/docs
 * - serves the raw Swagger JSON at /api/docs.json
 */
app.use(
	"/api/docs",
	swaggerUi.serve,
	swaggerUi.setup(swaggerSpec, swaggerUiOptions),
);
app.get("/api/docs.json", (req, res) => {
	res.status(200).json(swaggerSpec);
});

/**
 * 	Routes Use
 * - test routes
 * - auth routes
 * - expenses routes
 * - group routes
 * - payment routes
 * - meal routes
 * - menu routes
 * - bazar routes
 */
if (envConfig.NODE_ENV === "development" && testRouter) {
	app.use("/api/test", testRouter);
}
app.use("/api/auth", authRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/group", groupRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/meals", mealRouter);
app.use("/api/menus", menuRouter);
app.use("/api/bazar", bazarRouter);
app.use("/api/chat", chatRouter);

module.exports = app;
