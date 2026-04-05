const express = require("express");

const paymentController = require("../controllers/payment.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const paymentRouter = express.Router();

/**
 * - create a payment entry for the authenticated user
 * - POST /api/payment
 * - requires user authentication
 */
paymentRouter.post(
	"/",
	authMiddleware.authUserMiddleware,
	paymentController.createPayment,
);

/**
 * - confirm a payment by transactionID for the authenticated user
 * - PATCH /api/payment/confirm/:paymentID
 * - requires user authentication
 */
paymentRouter.post(
	"/confirm/:paymentID",
	authMiddleware.authManagerMiddleware,
	paymentController.confirmPayment,
);

/**
 * - get payments for the authenticated user's group
 * - GET /api/payment
 * - requires manager authentication
 * - supports filtering by transactionID, userID, fromDate, toDate
 */
paymentRouter.get(
	"/",
	authMiddleware.authManagerMiddleware,
	paymentController.getPayments,
);

/**
 * - get payments for the authenticated user's group
 * - GET /api/payment/user
 * - requires user authentication
 */
paymentRouter.get(
	"/user",
	authMiddleware.authUserMiddleware,
	paymentController.getUserPayments,
);

module.exports = paymentRouter;
