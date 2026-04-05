const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware");
const cacheMiddleware = require("../middlewares/cache.middleware");

const groupController = require("../controllers/group.controller");

const groupRouter = express.Router();

/**
 * - create a new group
 * - POST /api/groups
 * - protected route, requires valid Firebase ID token and group manager role
 */
groupRouter.post(
	"/",
	authMiddleware.authManagerMiddleware,
	cacheMiddleware.invalidateCache(["group", "expenses", "payment"]),
	groupController.createGroup,
);

/**
 * - send join code to a list of emails
 * - POST /api/groups/send-join-code
 * - protected route, requires valid Firebase ID token and group manager role
 */
groupRouter.post(
	"/send-join-code",
	authMiddleware.authManagerMiddleware,
	cacheMiddleware.invalidateCache(["group"]),
	groupController.sendJoinCode,
);

/**
 * - join a group using a join code
 * - POST /api/groups/join
 * - protected route, requires valid Firebase ID token and group membership
 */
groupRouter.post(
	"/join",
	authMiddleware.authUserMiddleware,
	cacheMiddleware.invalidateCache(["group", "expenses", "payment"]),
	groupController.joinByJoinCode,
);

/**
 * - remove a user from the group by email
 * - POST /api/groups/remove-user
 * - protected route, requires valid Firebase ID token and group manager role
 */
groupRouter.post(
	"/remove-user",
	authMiddleware.authManagerMiddleware,
	cacheMiddleware.invalidateCache(["group", "expenses", "payment"]),
	groupController.removeUserFromGroup,
);

/**
 * - get group details for the manager
 * - GET /api/groups/details
 * - protected route, requires valid Firebase ID token and group manager role
 */
groupRouter.get(
	"/details",
	authMiddleware.authManagerMiddleware,
	cacheMiddleware.getFromCache("group", 120),
	groupController.getGroupDetails,
);

/**
 * - get group details for a member
 * - GET /api/groups/details/:groupId
 * - protected route, requires valid Firebase ID token and group membership
 */
groupRouter.get(
	"/details/:groupId",
	authMiddleware.authUserMiddleware,
	cacheMiddleware.getFromCache("group", 120),
	groupController.getGroupDetailsForMember,
);

/**
 * - change the manager role to another user in the group
 * - POST /api/groups/change-role
 * - protected route, requires valid Firebase ID token and group manager role
 */
groupRouter.post(
	"/change-role",
	authMiddleware.authManagerMiddleware,
	cacheMiddleware.invalidateCache(["group", "expenses", "payment"]),
	groupController.chengeUserRole,
);

module.exports = groupRouter;
