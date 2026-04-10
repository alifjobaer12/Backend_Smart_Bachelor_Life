const express = require("express");

const paymentController = require("../controllers/payment.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const cacheMiddleware = require("../middlewares/cache.middleware");
const { authSensitiveLimiter } = require("../middlewares/security.middleware");

const paymentRouter = express.Router();

/**
 * - create a payment entry for the authenticated user
 * - POST /api/payment
 * - requires user authentication
 */
paymentRouter.post(
	"/",
	authSensitiveLimiter,
	authMiddleware.authUserMiddleware,
	cacheMiddleware.invalidateCache(["payment"]),
	paymentController.createPayment,
);

/**
 * - create a stripe checkout session
 * - POST /api/payment/stripe/checkout-session
 * - requires user authentication
 */
paymentRouter.post(
	"/stripe/checkout-session",
	authSensitiveLimiter,
	authMiddleware.authUserMiddleware,
	paymentController.createStripeCheckoutSession,
);

/**
 * - confirm stripe checkout session and persist payment
 * - POST /api/payment/stripe/confirm-session
 * - requires user authentication
 */
paymentRouter.post(
	"/stripe/confirm-session",
	authSensitiveLimiter,
	authMiddleware.authUserMiddleware,
	cacheMiddleware.invalidateCache(["payment"]),
	paymentController.confirmStripeCheckoutSession,
);

/**
 * - confirm a payment by transactionID for the authenticated user
 * - PATCH /api/payment/confirm/:paymentID
 * - requires user authentication
 */
paymentRouter.patch(
	"/confirm/:paymentID",
	authSensitiveLimiter,
	authMiddleware.authManagerMiddleware,
	cacheMiddleware.invalidateCache(["payment"]),
	paymentController.confirmPayment,
);

/**
 * - reject a payment by transactionID for the authenticated manager
 * - POST /api/payment/reject/:paymentID
 * - requires manager authentication
 */
paymentRouter.post(
	"/reject/:paymentID",
	authSensitiveLimiter,
	authMiddleware.authManagerMiddleware,
	cacheMiddleware.invalidateCache(["payment"]),
	paymentController.rejectPayment,
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
	cacheMiddleware.getFromCache("payment", 120),
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
	cacheMiddleware.getFromCache("payment", 120),
	paymentController.getUserPayments,
);

module.exports = paymentRouter;
