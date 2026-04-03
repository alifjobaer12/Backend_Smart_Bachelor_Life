const express = require("express");

const authMiddleware = require("../middlewares/auth.middleware");

const groupController = require("../controllers/group.controller");

const groupRouter = express.Router();


groupRouter.post(
	"/",
	authMiddleware.authManagerMiddleware,
	groupController.createGroup,
);

groupRouter.post(
	"/send-join-code",
	authMiddleware.authManagerMiddleware,
	groupController.sendJoinCode,
);

groupRouter.post(
	"/join",
	authMiddleware.authUserMiddleware,
	groupController.joinByJoinCode,
);

groupRouter.post(
	"/remove-user",
	authMiddleware.authManagerMiddleware,
	groupController.removeUserFromGroup,
);

module.exports = groupRouter;