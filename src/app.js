const express = require("express");
const cors = require("cors");
const envConfig = require("./config/env.config");

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
app.get("/", (req, res) => {
	res.send("The SBL Server is Running...");
});

module.exports = app;