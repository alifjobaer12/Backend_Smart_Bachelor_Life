const mongoose = require("mongoose");

const envConfig = require("./env.config");

const logger = require("../utils/logger.util");

// Function to connect to MongoDB
const connectDB = async () => {
	await mongoose
		.connect(envConfig.MONGO_URI)
		.then(() => {
			logger.info("✔️   MongoDB connected successfully");
		})
		.catch((err) => {
			logger.error("MongoDB connection failed:", err.message);
			process.exit(1);
		});
};

module.exports = connectDB;
