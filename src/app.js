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
 */
const testRouter =
	envConfig.NODE_ENV === "development"
		? require("./routes/route.test")
		: null;

const authRouter = require("./routes/auth.route");
const expensesRouter = require("./routes/expenses.route");
const groupRouter = require("./routes/group.route");
const paymentRouter = require("./routes/payment.route");

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
 */
if (envConfig.NODE_ENV === "development" && testRouter) {
	app.use("/api/test", testRouter);
}
app.use("/api/auth", authRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/group", groupRouter);
app.use("/api/payment", paymentRouter);

module.exports = app;