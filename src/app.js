const express = require("express");
const cors = require("cors");
const envConfig = require("./config/env.config");

// Create app FIRST
const app = express();

// Middlewares
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

// Routes import
const mealRoutes = require("./routes/meal.route");
const menuRoutes = require("./routes/menu.route");
const bazarRoutes = require("./routes/bazar.route");
const authRouter = require("./routes/auth.route");

// Routes use
app.use("/api/meals", mealRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/bazar", bazarRoutes);
app.use("/api/auth", authRouter);

// Health check
app.get("/health", (req, res) => {
	res.status(200).json({
		success: true,
		message: "OK",
	});
});

module.exports = app;