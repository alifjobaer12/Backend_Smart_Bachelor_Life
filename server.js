const app = require("./src/app");
const envConfig = require("./src/config/env.config");

// Connect to MongoDB and Redis before starting the server
const connectDB = require("./src/config/mongoDB.config");
const { connectRedis } = require("./src/config/redis.config");

connectDB();
connectRedis();

const PORT = envConfig.PORT || 3000;

// Start the server
app.listen(PORT, () => {
	console.log(`SBL server is running on port ${PORT}`);
});
