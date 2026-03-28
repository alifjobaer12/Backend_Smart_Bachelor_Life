const { createClient } = require("redis");

const envConfig = require("./env.config");

let client;

const connectRedis = async () => {
	try {
		const redisURL = envConfig.REDIS_URL;

		client = createClient({
			url: redisURL,
		});

		client.on("error", (err) => {
			console.error("Redis Client Error:", err.message);
		});

		await client.connect();
		console.log("✔️  Redis connected successfully");

		return client;
	} catch (error) {
		console.error("Redis connection error:", error.message);
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
		console.log("✔️  Redis disconnected");
	}
};

module.exports = {
	connectRedis,
	getRedisClient,
	disconnectRedis,
};
