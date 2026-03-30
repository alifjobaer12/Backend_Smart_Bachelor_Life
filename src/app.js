const express = require("express");
const cors = require("cors");
const envConfig = require("./config/env.config");

/**
 * 	Routes Requires
 * - auth routes
 */
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
 * - auth routes
 */
app.use("/api/auth", authRouter);

module.exports = app;
