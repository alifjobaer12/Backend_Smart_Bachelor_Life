const mongoose = require("mongoose");

const envConfig = require("./env.config");

// Function to connect to MongoDB
const connectDB = async () => {
	await mongoose
		.connect(envConfig.MONGO_URI)
		.then(() => {
			console.log("✔️  MongoDB connected successfully");
		})
		.catch((err) => {
			console.error("Error connecting to MongoDB:", err);
			process.exit(1);
		});
};

module.exports = connectDB;
