const paymentModel = require("../models/payment.model");
const groupModel = require("../models/group.model");
const { getRedisClient } = require("../config/redis.config");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

async function clearPaymentCache(logCtx) {
	let redisClient;

	try {
		redisClient = getRedisClient();
	} catch (error) {
		logger.warn("Payment cache clear skipped: redis unavailable", {
			...logCtx,
			error: getErrorMeta(error),
		});
		return;
	}

	const keysToDelete = [];

	for await (const key of redisClient.scanIterator({
		MATCH: "cache:payment:*",
		COUNT: 100,
	})) {
		keysToDelete.push(key);
	}

	if (keysToDelete.length === 0) {
		return;
	}

	await redisClient.del(keysToDelete);

	logger.info("Payment cache cleared", {
		...logCtx,
		deletedKeys: keysToDelete.length,
	});
}

/**
 * - create a payment entry for the authenticated user
 * - POST /api/payment
 * - requires user authentication
 */
async function createPayment(req, res) {
	const logCtx = getLogContext(req);
	const { amount, paymentMethod, transactionID, senderNumber } = req.body;
	const parsedAmount = Number(amount);
	const normalizedPaymentMethod = String(paymentMethod || "").trim();
	const isStripePayment = normalizedPaymentMethod.toLowerCase() === "stripe";
	const normalizedTransactionID = String(transactionID || "").trim();
	const normalizedSenderNumber = String(senderNumber || "").trim();
	const generatedStripeTransactionID = `STRIPE-${Date.now()}`;
	const finalTransactionID = isStripePayment
		? normalizedTransactionID || generatedStripeTransactionID
		: normalizedTransactionID;

	logger.info("Create payment attempt", {
		...logCtx,
		amount,
		paymentMethod,
		transactionID,
		senderNumber,
	});

	if (
		amount === undefined ||
		amount === null ||
		Number.isNaN(parsedAmount) ||
		parsedAmount < 0 ||
		!normalizedPaymentMethod ||
		(!isStripePayment && (!normalizedSenderNumber || !normalizedTransactionID))
	) {
		logger.warn("Create payment failed: invalid payload", {
			...logCtx,
			amount,
			paymentMethod,
			transactionID,
			senderNumber,
		});

		const requirementMessage = isStripePayment
			? "amount and paymentMethod are required"
			: "amount, paymentMethod, senderNumber and transactionID are required";

		return res.status(400).json({
			success: false,
			message: requirementMessage,
		});
	}

	try {
		const group = await groupModel.findOne({
			$or: [{ managerID: req.user._id }, { userIDs: req.user._id }],
		});

		if (!group) {
			logger.warn("Create payment failed: user has no group", {
				...logCtx,
				userId: req.user._id,
			});

			return res.status(404).json({
				success: false,
				message: "User is not part of any group",
			});
		}

		logger.debug("Create payment creating document", {
			...logCtx,
			groupId: group._id,
			userId: req.user._id,
			amount: parsedAmount,
		});

		const payment = await paymentModel.create({
			groupID: group._id,
			userID: req.user._id,
			amount: parsedAmount,
			paymentMethod: normalizedPaymentMethod,
			senderNumber: isStripePayment ? "" : normalizedSenderNumber,
			transactionID: finalTransactionID,
		});

		logger.info("Create payment success", {
			...logCtx,
			paymentId: payment._id,
			groupId: group._id,
			userId: req.user._id,
			amount: parsedAmount,
		});

		await clearPaymentCache(logCtx);

		return res.status(201).json({
			success: true,
			message: "Payment created successfully",
			payment,
		});
	} catch (error) {
		if (error?.code === 11000) {
			logger.warn("Create payment failed: duplicate transactionID", {
				...logCtx,
				transactionID,
				error: getErrorMeta(error),
			});

			return res.status(409).json({
				success: false,
				message: "transactionID already exists",
			});
		}

		logger.error("Create payment failed", {
			...logCtx,
			amount,
			paymentMethod,
			transactionID,
			senderNumber,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "Failed to create payment",
			error: error.message,
		});
	}
}

/**
 * - confirm a payment by transactionID for the authenticated user
 * - PATCH /api/payment/confirm/:paymentID
 * - requires user authentication
 * - only users who are part of the same group as the payment can confirm it
 */
async function confirmPayment(req, res) {
	const logCtx = getLogContext(req);
	const { paymentID } = req.params;
	const { transactionID } = req.body;

	logger.info("Confirm payment attempt", {
		...logCtx,
		paymentID,
		transactionID,
	});

	if (!transactionID || String(transactionID).trim() === "" || !paymentID) {
		logger.warn("Confirm payment failed: missing paymentID/transactionID", {
			...logCtx,
			paymentID,
			transactionID,
		});

		return res.status(400).json({
			success: false,
			message: "transactionID and paymentID are required",
		});
	}

	try {
		const payment = await paymentModel.findOne({
			_id: paymentID,
			transactionID,
		});

		if (!payment) {
			logger.warn("Confirm payment failed: payment not found", {
				...logCtx,
				paymentID,
				transactionID,
			});

			return res.status(404).json({
				success: false,
				message: "Payment not found for the user",
			});
		}

		const isUserInGroup = await groupModel.findOne({
			managerID: req.user._id,
			$or: [{ managerID: payment.userID }, { userIDs: payment.userID }],
		});

		if (!isUserInGroup) {
			logger.warn("Confirm payment failed: unauthorized", {
				...logCtx,
				paymentID,
				paymentUserId: payment.userID,
				requestUserId: req.user._id,
			});

			return res.status(403).json({
				success: false,
				message: "User is not authorized to confirm this payment",
			});
		}

		payment.status = "COMPLETED";
		await payment.save();

		logger.info("Confirm payment success", {
			...logCtx,
			paymentId: payment._id,
			paymentUserId: payment.userID,
			confirmedBy: req.user._id,
		});

		await clearPaymentCache(logCtx);

		return res.status(200).json({
			success: true,
			message: "Payment confirmed successfully",
			payment,
		});
	} catch (error) {
		logger.error("Confirm payment failed", {
			...logCtx,
			paymentID,
			transactionID,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "Failed to confirm payment",
			error: error.message,
		});
	}
}

/**
 * - reject a pending payment by transactionID for the authenticated manager
 * - POST /api/payment/reject/:paymentID
 * - requires manager authentication
 */
async function rejectPayment(req, res) {
	const logCtx = getLogContext(req);
	const { paymentID } = req.params;
	const { transactionID } = req.body;

	logger.info("Reject payment attempt", {
		...logCtx,
		paymentID,
		transactionID,
	});

	if (!transactionID || String(transactionID).trim() === "" || !paymentID) {
		logger.warn("Reject payment failed: missing paymentID/transactionID", {
			...logCtx,
			paymentID,
			transactionID,
		});

		return res.status(400).json({
			success: false,
			message: "transactionID and paymentID are required",
		});
	}

	try {
		const payment = await paymentModel.findOne({
			_id: paymentID,
			transactionID,
		});

		if (!payment) {
			logger.warn("Reject payment failed: payment not found", {
				...logCtx,
				paymentID,
				transactionID,
			});

			return res.status(404).json({
				success: false,
				message: "Payment not found for the user",
			});
		}

		const isUserInGroup = await groupModel.findOne({
			managerID: req.user._id,
			$or: [{ managerID: payment.userID }, { userIDs: payment.userID }],
		});

		if (!isUserInGroup) {
			logger.warn("Reject payment failed: unauthorized", {
				...logCtx,
				paymentID,
				paymentUserId: payment.userID,
				requestUserId: req.user._id,
			});

			return res.status(403).json({
				success: false,
				message: "User is not authorized to reject this payment",
			});
		}

		payment.status = "FAILED";
		await payment.save();

		logger.info("Reject payment success", {
			...logCtx,
			paymentId: payment._id,
			paymentUserId: payment.userID,
			rejectedBy: req.user._id,
		});

		await clearPaymentCache(logCtx);

		return res.status(200).json({
			success: true,
			message: "Payment rejected successfully",
			payment,
		});
	} catch (error) {
		logger.error("Reject payment failed", {
			...logCtx,
			paymentID,
			transactionID,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "Failed to reject payment",
			error: error.message,
		});
	}
}

/**
 * - get payments for the authenticated user's group
 * - GET /api/payment
 * - requires manager authentication
 * - supports filtering by transactionID, userID, fromDate, toDate
 */
async function getPayments(req, res) {
	const logCtx = getLogContext(req);
	const transactionID = req.query.transactionID || req.query.transactionId;
	const userID = req.query.userID || req.query.userId || req.query.uid;
	const fromDate =
		req.query.fromDate || req.query.formDate || req.query.dateFrom;
	const toDate = req.query.toDate || req.query.dateTo;

	logger.info("Get payments attempt", {
		...logCtx,
		transactionID,
		userID,
		fromDate,
		toDate,
	});

	const normalizeDate = (value) => {
		if (!value) {
			return null;
		}

		const parsedDate = new Date(value);
		return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
	};

	try {
		const normalizedFromDate = normalizeDate(fromDate);
		if (fromDate && !normalizedFromDate) {
			logger.warn("Get payments failed: invalid fromDate", {
				...logCtx,
				fromDate,
			});

			return res.status(400).json({
				success: false,
				message: "Invalid fromDate",
			});
		}

		const normalizedToDate = normalizeDate(toDate);
		if (toDate && !normalizedToDate) {
			logger.warn("Get payments failed: invalid toDate", {
				...logCtx,
				toDate,
			});

			return res.status(400).json({
				success: false,
				message: "Invalid toDate",
			});
		}

		const group = await groupModel.findOne({
			managerID: req.user._id,
		});

		if (!group) {
			logger.warn("Get payments failed: user not group manager", {
				...logCtx,
				userId: req.user._id,
			});

			return res.status(403).json({
				success: false,
				message: "User is not part of any group",
			});
		}

		if (transactionID) {
			const payment = await paymentModel.findOne({
				groupID: group._id,
				transactionID: transactionID,
			});

			if (!payment) {
				logger.warn("Get payments failed: transactionID not found", {
					...logCtx,
					groupId: group._id,
					transactionID,
				});

				return res.status(404).json({
					success: false,
					message: "Payment not found",
				});
			}

			logger.info("Get payments success: single payment", {
				...logCtx,
				groupId: group._id,
				paymentId: payment._id,
				transactionID,
			});

			return res.status(200).json({
				success: true,
				message: "Payment fetched successfully",
				payment,
			});
		}

		const startDate =
			normalizedFromDate ||
			(() => {
				const now = new Date();
				const thirtyDaysAgo = new Date(now);
				thirtyDaysAgo.setDate(now.getDate() - 30);
				thirtyDaysAgo.setHours(0, 0, 0, 0);
				return thirtyDaysAgo;
			})();

		const endDate = normalizedToDate || new Date();
		if (startDate > endDate) {
			logger.warn("Get payments failed: invalid date range", {
				...logCtx,
				fromDate,
				toDate,
			});

			return res.status(400).json({
				success: false,
				message: "fromDate cannot be greater than toDate",
			});
		}

		endDate.setHours(23, 59, 59, 999);

		const createdAtFilter = {
			$gte: startDate,
			$lte: endDate,
		};

		const paymentFilter = {
			groupID: group._id,
			createdAt: createdAtFilter,
		};

		if (userID) {
			const isUserInGroup =
				String(group.managerID) === String(userID) ||
				group.userIDs.some((id) => String(id) === String(userID));

			if (!isUserInGroup) {
				logger.warn("Get payments failed: user not in group filter", {
					...logCtx,
					groupId: group._id,
					userID,
				});

				return res.status(404).json({
					success: false,
					message: "User is not part of this group",
				});
			}

			paymentFilter.userID = userID;
		}

		const payments = await paymentModel
			.find(paymentFilter)
			.sort({ createdAt: -1 })
			.populate("userID", "displayName email");

		logger.info("Get payments success", {
			...logCtx,
			groupId: group._id,
			count: payments.length,
			filters: {
				transactionID: !!transactionID,
				userID: userID || null,
				fromDate: startDate,
				toDate: endDate,
			},
		});

		return res.status(200).json({
			success: true,
			message: "Payments fetched successfully",
			count: payments.length,
			payments,
		});
	} catch (error) {
		logger.error("Get payments failed", {
			...logCtx,
			transactionID,
			userID,
			fromDate,
			toDate,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "Failed to fetch payments",
			error: error.message,
		});
	}
}

/**
 * - get payments for the authenticated user's group
 * - GET /api/payment/user
 * - requires user authentication
 * - returns only payments made by the authenticated user
 */
async function getUserPayments(req, res) {
	const logCtx = getLogContext(req);

	logger.info("Get user payments attempt", {
		...logCtx,
		userId: req.user._id,
	});

	try {
		const payments = await paymentModel
			.find({
				userID: req.user._id,
			})
			.sort({ createdAt: -1 });

		logger.info("Get user payments success", {
			...logCtx,
			userId: req.user._id,
			count: payments.length,
		});

		return res.status(200).json({
			success: true,
			message: "User payments fetched successfully",
			count: payments.length,
			payments,
		});
	} catch (error) {
		logger.error("Get user payments failed", {
			...logCtx,
			userId: req.user._id,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "Failed to fetch user payments",
			error: error.message,
		});
	}
}

module.exports = {
	createPayment,
	confirmPayment,
	rejectPayment,
	getPayments,
	getUserPayments,
};
