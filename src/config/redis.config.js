const { createClient } = require("redis");

const envConfig = require("./env.config");

const logger = require("../utils/logger.util");

let client;

const connectRedis = async () => {
	try {
		const redisURL = envConfig.REDIS_URL;

		client = createClient({
			url: redisURL,
		});

		client.on("error", (err) => {
			logger.error("Redis Client Error:", err.message);
		});

		await client.connect();
		logger.info("✔️  Redis connected successfully");

		return client;
	} catch (err) {
		logger.error("Error connecting to Redis:", err.message);
		process.exit(1);
	}
};

const getRedisClient = () => {
	if (!client) {
		throw new Error(
			"Redis client not initialized. Call connectRedis first.",
		);
	}
	return client;
};

const disconnectRedis = async () => {
	if (client) {
		await client.disconnect();
		logger.info("✔️  Redis disconnected successfully");
	}
};

module.exports = {
	connectRedis,
	getRedisClient,
	disconnectRedis,
};
