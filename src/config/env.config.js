require("dotenv").config();

// Check for required environment variables and provide warnings or errors

if (!process.env.CLIENT_URL) {
	console.warn(
		"CLIENT_URL is not defined in the environment variables. Using default allowed origins.",
	);
}

if (!process.env.PORT) {
	console.warn(
		"PORT is not defined in the environment variables. Using default port 3000.",
	);
}

if (!process.env.MONGO_URI) {
	throw new Error("MONGO_URI is not defined in the environment variables");
}

if (!process.env.REDIS_URL) {
	throw new Error("REDIS_URL is not defined in the environment variables");
}

const envConfig = {
	MONGO_URI: process.env.MONGO_URI,
	REDIS_URL: process.env.REDIS_URL,
	CLIENT_URL: process.env.CLIENT_URL,
	PORT: process.env.PORT,
};

module.exports = envConfig;
