const express = require("express");
const cors = require("cors");
const envConfig = require("./config/env.config");
//routes require here
const mealRoutes = require("./routes/meal.route");
const menuRoutes = require("./routes/menu.route");
const bazarRoutes = require("./routes/bazar.route");
const expenseRoutes = require("./routes/expense.route");
const groupRoutes = require("./routes/group.route");



// routes
app.use("/api/meals", mealRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/bazar", bazarRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/groups", groupRoutes);


/**
 * 	Routes Requires
 * - test routes
 * - auth routes
 */
const testRouter =
	envConfig.NODE_ENV === "development"
		? require("./routes/route.test")
		: null;
const authRouter = require("./routes/auth.route");

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
 */
if (envConfig.NODE_ENV === "development" && testRouter) {
	app.use("/api/test", testRouter);
}
app.use("/api/auth", authRouter);

module.exports = app;
