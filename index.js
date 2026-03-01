const express = require('express');
const cors = require('cors');
const connectDB = require('./src/utility/MongoDB');
const { connectRedis } = require('./src/utility/redis');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send("The SBL Server is Running...")
})

// Connect to MongoDB and Redis
connectDB();
connectRedis();




app.listen(port, () => {
    console.log(`SBL server is running on port ${port}`);
})