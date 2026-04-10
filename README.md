# Smart Bachelor Life Server

Backend API for the Smart Bachelor Life project. The service is built with Node.js, Express, MongoDB, Redis, Firebase Admin, and Swagger, with production hardening for logging, rate limiting, CORS, and security headers.

## Overview

This server provides the core APIs for group-based bachelor life management, including authentication, group membership, expenses, payments, meals, menus, bazar records, and group chat.

Production-focused features currently included in the codebase:

- Structured JSON logging with request context
- Swagger UI and raw OpenAPI JSON
- Redis-backed caching and invalidation
- Helmet security headers
- Global and route-level rate limiting
- Environment validation at startup
- CORS allow-list for frontend origins
- Stripe checkout support
- File upload support for expenses and bazar documents

## Tech Stack

- Node.js 20+
- Express 5
- MongoDB with Mongoose
- Redis
- Firebase Admin SDK
- Swagger UI / swagger-jsdoc
- Winston logging
- Multer for file uploads
- Stripe
- SendGrid email delivery
- ImageKit storage

## Project Structure

```text
Smart-Bachelor-Life-Server/
|-- server.js
|-- package.json
|-- README.md
|-- src/
|   |-- app.js
|   |-- config/
|   |   |-- env.config.js
|   |   |-- firebase.config.js
|   |   |-- mongoDB.config.js
|   |   |-- redis.config.js
|   |   |-- swagger.config.js
|   |-- controllers/
|   |-- middlewares/
|   |-- models/
|   |-- routes/
|   |-- services/
|   |-- utils/
|-- __tests__/
```

## Prerequisites

- Node.js 20 or newer
- MongoDB connection string
- Redis connection string
- Firebase service account credentials
- ImageKit credentials
- SendGrid API key and sender email
- Stripe secret key and currency

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the project root.

```env
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173

MONGO_URI=mongodb+srv://...
REDIS_URL=redis://...

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY="your_firebase_private_key"

IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_USER=your_verified_sender_email

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_CURRENCY=bdt

SWAGGER_SERVER_URL=https://your-api-domain.com
```

### Environment Notes

- `PORT` is optional. The server defaults to `3000`.
- `NODE_ENV` defaults to `development` if omitted.
- `CLIENT_URL` is optional in development, but required in production.
- `FIREBASE_PRIVATE_KEY` should keep escaped newlines as `\n` in the `.env` file.
- `SWAGGER_SERVER_URL` is optional and lets Swagger point at your deployed API URL.

## Running the Server

Development mode:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## Available Scripts

- `npm run dev` - Start the server with nodemon.
- `npm start` - Start the server with Node.js.
- `npm test` - Run the smoke test suite.

## API Documentation

- Swagger UI: `/api/docs`
- Raw OpenAPI JSON: `/api/docs.json`

## Health Check

- `GET /health`

Example response:

```json
{
	"success": true,
	"message": "OK"
}
```

## API Routes

### Auth

- `POST /api/auth/register`
- `POST /api/auth/manager-register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Group

- `POST /api/group`
- `POST /api/group/send-join-code`
- `POST /api/group/join`
- `POST /api/group/remove-user`
- `POST /api/group/revoke-invite`
- `GET /api/group/details`
- `GET /api/group/details/:groupId`
- `PATCH /api/group/title`
- `PATCH /api/group/notice`
- `POST /api/group/leave`
- `POST /api/group/change-role`

### Expenses

- `POST /api/expenses`
- `GET /api/expenses`

### Payment

- `POST /api/payment`
- `POST /api/payment/stripe/checkout-session`
- `POST /api/payment/stripe/confirm-session`
- `POST /api/payment/confirm/:paymentID`
- `POST /api/payment/reject/:paymentID`
- `GET /api/payment`
- `GET /api/payment/user`

### Meals

- `POST /api/meals`
- `GET /api/meals`
- `PATCH /api/meals/:id`
- `DELETE /api/meals/:id`

### Menus

- `POST /api/menus`
- `GET /api/menus`
- `PATCH /api/menus/:id`
- `DELETE /api/menus/:id`

### Bazar

- `POST /api/bazar`
- `GET /api/bazar`
- `PATCH /api/bazar/:id`
- `DELETE /api/bazar/:id`

### Chat

- `POST /api/chat/messages`
- `GET /api/chat/messages`
- `PATCH /api/chat/messages/read`
- `PATCH /api/chat/typing`
- `GET /api/chat/typing`

### Development Test Routes

- `GET /api/test`
- `POST /api/test/test-login`
- `POST /api/test/test-email`
- `POST /api/test/test-upload`
- `GET /api/test/get-code`

## Production Notes

- The app uses Helmet and rate limiting globally, with additional limits on sensitive routes.
- CORS is allow-listed using `CLIENT_URL` plus local development origins.
- MongoDB and Redis must be available before the server starts.
- The server mounts Swagger and logs requests before the route handlers, so operational issues are easier to trace.
- Development-only test routes are only mounted when `NODE_ENV=development`.

## Deployment Checklist

1. Set all required environment variables.
2. Point `CLIENT_URL` to the real frontend origin.
3. Ensure MongoDB, Redis, and external services are reachable from the deployment platform.
4. Verify `/health` returns 200.
5. Open `/api/docs` and confirm the OpenAPI spec loads.

## License

ISC
