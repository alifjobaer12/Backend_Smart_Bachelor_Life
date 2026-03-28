# Smart Bachelor Life Server

Backend server for the Smart Bachelor Life project, built with Node.js, Express, MongoDB (Mongoose), and Redis.

## Tech Stack

- Node.js
- Express
- MongoDB + Mongoose
- Redis
- dotenv
- CORS

## Project Structure

```text
Smart-Bachelor-Life-Server/
|-- server.js
|-- package.json
|-- src/
|   |-- app.js
|   |-- config/
|   |   |-- mongoDB.config.js
|   |   |-- redis.config.js
|   |-- models/
|   |   |-- user.model.js
|   |-- utility/
```

## Prerequisites

- Node.js (recommended: latest LTS)
- MongoDB instance (local or cloud)
- Redis instance (local or cloud)

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
REDIS_URL=your_redis_connection_string
CLIENT_URL=http://localhost:3000
```

### Notes

- `PORT` is optional. Default is `3000`.
- `CLIENT_URL` can be used to allow a specific frontend origin via CORS.
- If `CLIENT_URL` is not set, the server falls back to these allowed origins:
  - `http://localhost:3000`
  - `http://localhost:3001`
  - `http://localhost:5000`

## Running the Server

Development mode (with nodemon):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## Available Scripts

- `npm run dev` - Starts server with nodemon.
- `npm start` - Starts server with Node.js.
- `npm test` - Placeholder script.

## Current Routes

- `GET /` - Health/info route.

Example response:

```text
The SBL Server is Running...
```

## License

ISC
