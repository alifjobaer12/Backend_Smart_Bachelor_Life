const connectDB = require('./src/utility/MongoDB');
const { connectRedis } = require('./src/utility/redis');

const app = require('./src/app');
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send("The SBL Server is Running...")
})

// Connect to MongoDB and Redis
connectDB();
connectRedis();


app.listen(port, () => {
    console.log(`SBL server is running on port ${port}`);
})