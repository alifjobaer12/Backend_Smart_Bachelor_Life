require("dotenv").config();

// Check for required environment variables and provide warnings or errors

if (!process.env.NODE_ENV) {
	console.warn(
		"NODE_ENV is not defined in the environment variables. Defaulting to 'development'.",
	);
}

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

if (!process.env.FIREBASE_PROJECT_ID) {
	throw new Error(
		"FIREBASE_PROJECT_ID is not defined in the environment variables",
	);
}

if (!process.env.FIREBASE_CLIENT_EMAIL) {
	throw new Error(
		"FIREBASE_CLIENT_EMAIL is not defined in the environment variables",
	);
}

if (!process.env.FIREBASE_PRIVATE_KEY) {
	throw new Error(
		"FIREBASE_PRIVATE_KEY is not defined in the environment variables",
	);
}

const envConfig = {
	NODE_ENV: process.env.NODE_ENV || "development",
	CLIENT_URL: process.env.CLIENT_URL,
	PORT: process.env.PORT,
	MONGO_URI: process.env.MONGO_URI,
	REDIS_URL: process.env.REDIS_URL,
	FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
	FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
	FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY.replace(
		/\\n/g,
		"\n",
	),
};

module.exports = envConfig;
