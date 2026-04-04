const express = require("express");
const cors = require("cors");
const envConfig = require("./config/env.config");

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
	})
);

// routes
const mealRoutes = require("./routes/meal.route");
const menuRoutes = require("./routes/menu.route");
const bazarRoutes = require("./routes/bazar.route");

app.use("/api/meals", mealRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/bazar", bazarRoutes);
app.use("/api/auth", authRouter);

// test route
if (envConfig.NODE_ENV === "development" && testRouter) {
	app.use("/api/test", testRouter);
}

// health
app.get("/health", (req, res) => {
	res.status(200).json({
		success: true,
		message: "OK",
	});
});

module.exports = app;