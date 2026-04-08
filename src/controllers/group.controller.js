const mongoose = require("mongoose");

const groupModel = require("../models/group.model");
const userModel = require("../models/user.model");

const joinCodeGenerator = require("../utils/joinCodeGenerator.util");
const emailService = require("../services/email.service");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

async function unlockRoleChoiceIfNoGroup(userId, session) {
	const existingGroup = await groupModel
		.findOne({
			$or: [{ managerID: userId }, { userIDs: userId }],
		})
		.session(session || null);

	if (!existingGroup) {
		await userModel.findByIdAndUpdate(userId, {
			role: "USER",
			canBePromoted: true,
			roleSelectionCompleted: false,
		});
	}
}

/**
 * Create a new group
 * POST /api/groups
 * Protected route, requires valid Firebase ID token and group manager role
 */
async function createGroup(req, res) {
	const logCtx = getLogContext(req);
	const { title, address } = req.body;

	logger.info("Create group attempt", {
		...logCtx,
		title,
		address,
	});

	if (!title || !address) {
		logger.warn("Create group failed: missing required fields", {
			...logCtx,
			title,
			address,
		});

		return res.status(400).json({
			success: false,
			message: "title and address are required for creating a group",
		});
	}

	try {
		const joinCode =
			await joinCodeGenerator.generateUniqueJoinCode(groupModel);

		const newGroup = await groupModel.create({
			title,
			address,
			managerID: req.user._id,
			joinCode,
		});

		logger.info("Create group success", {
			...logCtx,
			groupId: newGroup._id,
			title: newGroup.title,
		});

		return res.status(201).json({
			success: true,
			message: "Group created successfully",
			group: newGroup,
		});
	} catch (error) {
		logger.error("Create group failed", {
			...logCtx,
			title,
			address,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while creating the group",
		});
	}
}

/**
 * - send join code to a list of emails
 * - POST /api/groups/send-join-code
 * - protected route, requires valid Firebase ID token and group manager role
 */
async function sendJoinCode(req, res) {
	const logCtx = getLogContext(req);
	const { userList } = req.body;

	logger.info("Send join code attempt", {
		...logCtx,
		userListCount: userList?.length || 0,
	});

	if (!userList || !Array.isArray(userList) || userList.length === 0) {
		logger.warn("Send join code failed: invalid userList", {
			...logCtx,
			userList,
		});

		return res.status(400).json({
			success: false,
			message: "userList is required and should be a non-empty array",
		});
	}

	try {
		const group = await groupModel.findOne({
			managerID: req.user._id,
		});

		if (!group) {
			logger.warn("Send join code failed: user not group manager", {
				...logCtx,
				userId: req.user._id,
			});

			return res.status(403).json({
				success: false,
				message: "Only group managers can send join codes",
			});
		}

		const joinCode =
			await joinCodeGenerator.generateUniqueJoinCode(groupModel);

		const invalidEmails = [];
		const successfullyInvitedEmails = [];
		const emailRegex = /^\S+@\S+\.\S+$/;

		for (const rawEmail of userList) {
			const email = String(rawEmail || "")
				.trim()
				.toLowerCase();

			if (!emailRegex.test(email)) {
				invalidEmails.push(email || String(rawEmail || ""));
				logger.debug("Send join code: invalid email format", {
					...logCtx,
					email,
				});
				continue;
			}

			try {
				const user = await userModel
					.findOne({ email })
					.select("displayName");
				const receiverName = user?.displayName || "there";

				await emailService.sendJoinCodeEmail(
					email,
					receiverName,
					group.title,
					joinCode,
				);
				successfullyInvitedEmails.push(email);

				logger.debug("Send join code: email sent", {
					...logCtx,
					email,
					groupId: group._id,
				});
			} catch (error) {
				invalidEmails.push(email);
				logger.error("Send join code: email send failed", {
					...logCtx,
					email,
					groupId: group._id,
					error: getErrorMeta(error),
				});
			}
		}

		// Update invited emails and set the latest join code
		if (successfullyInvitedEmails.length > 0) {
			await groupModel.updateOne(
				{ _id: group._id },
				{
					$addToSet: {
						invitedEmails: {
							$each: successfullyInvitedEmails,
						},
					},
					$set: {
						joinCode: joinCode,
					},
				},
			);

			logger.info("Send join code: invited emails updated", {
				...logCtx,
				groupId: group._id,
				successfulCount: successfullyInvitedEmails.length,
			});
		}

		logger.info("Send join code success", {
			...logCtx,
			groupId: group._id,
			successfulCount: successfullyInvitedEmails.length,
			invalidCount: invalidEmails.length,
		});

		return res.status(200).json({
			success: true,
			message:
				invalidEmails.length > 0
					? "Join codes sent with some failures"
					: "Join codes sent successfully",
			invalidEmails,
			successfullyInvitedEmails,
			joinCode,
		});
	} catch (error) {
		logger.error("Send join code failed", {
			...logCtx,
			userListCount: userList.length,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while sending join codes",
		});
	}
}

/**
 * - join a group using a join code
 * - POST /api/groups/join
 * - protected route, requires valid Firebase ID token and group membership
 */
async function joinByJoinCode(req, res) {
	const logCtx = getLogContext(req);
	const { joinCode } = req.body;
	const userId = req.user._id;

	logger.info("Join group by code attempt", {
		...logCtx,
		joinCode: joinCode?.substring(0, 5) + "***",
	});

	if (!joinCode) {
		logger.warn("Join group by code failed: missing joinCode", {
			...logCtx,
		});

		return res.status(400).json({
			success: false,
			message: "joinCode is required to join a group",
		});
	}

	try {
		if (!req.user.canBePromoted) {
			logger.warn(
				"Join group by code failed: role choice already completed",
				{
					...logCtx,
					userId,
					userRole: req.user.role,
				},
			);

			return res.status(403).json({
				success: false,
				message:
					"You have already completed your one-time role choice after registration.",
			});
		}

		// Check if user is already a member of any group
		const userExistsInAnyGroup = await groupModel.findOne({
			userIDs: userId,
		});

		if (userExistsInAnyGroup) {
			logger.warn("Join group by code failed: user already in group", {
				...logCtx,
				existingGroupId: userExistsInAnyGroup._id,
				existingGroupTitle: userExistsInAnyGroup.title,
			});

			return res.status(400).json({
				success: false,
				message: `You are already a member of "${userExistsInAnyGroup.title}" group. You can only join one group.`,
			});
		}

		// Find the group by joinCode
		const group = await groupModel
			.findOne({ joinCode })
			.select("+invitedEmails");

		if (!group) {
			logger.warn("Join group by code failed: invalid joinCode", {
				...logCtx,
			});

			return res.status(404).json({
				success: false,
				message: "Invalid or expired join code",
			});
		}

		// Check if user was invited by the manager
		const isUserInvited = Array.isArray(group.invitedEmails)
			? group.invitedEmails.includes(req.user.email)
			: false;

		if (!isUserInvited) {
			logger.warn("Join group by code failed: user not invited", {
				...logCtx,
				groupId: group._id,
				userEmail: req.user.email,
			});

			return res.status(403).json({
				success: false,
				message:
					"You were not invited to join this group by the manager",
			});
		}

		// Add user to the group
		group.userIDs.push(userId);
		group.invitedEmails.pull(req.user.email);
		await group.save();

		await userModel.findByIdAndUpdate(userId, {
			role: "USER",
			roleSelectionCompleted: true,
			canBePromoted: false,
		});

		logger.info("Join group by code success", {
			...logCtx,
			groupId: group._id,
			groupTitle: group.title,
		});

		return res.status(200).json({
			success: true,
			message: `Joined group "${group.title}" successfully`,
			group,
		});
	} catch (error) {
		logger.error("Join group by code failed", {
			...logCtx,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while joining the group",
		});
	}
}

/**
 * - remove a user from the group by email
 * - POST /api/groups/remove-user
 * - protected route, requires valid Firebase ID token and group manager role
 */
async function removeUserFromGroup(req, res) {
	const logCtx = getLogContext(req);
	const { email } = req.body;

	logger.info("Remove user from group attempt", {
		...logCtx,
		email,
	});

	if (!email) {
		logger.warn("Remove user from group failed: missing email", {
			...logCtx,
		});

		return res.status(400).json({
			success: false,
			message: "email is required to remove a user from the group",
		});
	}

	const session = await mongoose.startSession();

	try {
		await session.withTransaction(async () => {
			const group = await groupModel
				.findOne({
					managerID: req.user._id,
				})
				.select("+invitedEmails")
				.session(session);

			if (!group) {
				logger.warn(
					"Remove user from group failed: user not group manager",
					{
						...logCtx,
						userId: req.user._id,
					},
				);

				throw new Error(
					"Only group managers can remove users from the group",
				);
			}

			const user = await userModel.findOne({ email }).session(session);

			if (!user) {
				logger.warn("Remove user from group failed: user not found", {
					...logCtx,
					email,
				});

				throw new Error("User with the provided email not found");
			}

			if (String(group.managerID) === String(user._id)) {
				throw new Error(
					"Manager cannot be removed from the group using this endpoint",
				);
			}

			group.userIDs.pull(user._id);
			group.invitedEmails.pull(user.email);
			await group.save({ session });
			await unlockRoleChoiceIfNoGroup(user._id, session);

			logger.debug("Remove user from group: sending removal email", {
				...logCtx,
				groupId: group._id,
				userEmail: email,
			});

			emailService
				.sendUserRemovalEmail(email, user.displayName, group.title)
				.catch((error) => {
					logger.error(
						"Remove user from group: removal email send failed",
						{
							...logCtx,
							email,
							error: getErrorMeta(error),
						},
					);
				});

			logger.info("Remove user from group success", {
				...logCtx,
				groupId: group._id,
				userEmail: email,
			});

			return res.status(200).json({
				success: true,
				message: "User removed from the group successfully",
				group,
			});
		});
	} catch (error) {
		logger.error("Remove user from group failed", {
			...logCtx,
			email,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: String(error?.message || "").includes("not found")
				? "User with the provided email not found"
				: String(error?.message || "").includes("group manager")
					? "Only group managers can remove users from the group"
					: String(error?.message || "").includes(
								"Manager cannot be removed",
						  )
						? "Manager cannot be removed from the group using this endpoint"
						: "An error occurred while removing the user from the group",
		});
	} finally {
		await session.endSession();
	}
}

/**
 * - get group details for the manager
 * - GET /api/groups/details
 * - protected route, requires valid Firebase ID token and group manager role
 */
async function getGroupDetails(req, res) {
	const logCtx = getLogContext(req);

	logger.info("Get group details (manager) attempt", {
		...logCtx,
	});

	try {
		const group = await groupModel
			.findOne({
				managerID: req.user._id,
			})
			.select("+invitedEmails")
			.populate("userIDs", "email displayName");

		if (!group) {
			logger.warn("Get group details (manager) failed: group not found", {
				...logCtx,
				userId: req.user._id,
			});

			return res.status(404).json({
				success: false,
				message: "Group not found for the manager",
			});
		}

		logger.info("Get group details (manager) success", {
			...logCtx,
			groupId: group._id,
			memberCount: group.userIDs?.length || 0,
		});

		return res.status(200).json({
			success: true,
			message: "Group details retrieved successfully",
			group,
		});
	} catch (error) {
		logger.error("Get group details (manager) failed", {
			...logCtx,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while retrieving group details",
		});
	}
}

/**
 * - update the payment notice for the manager
 * - PATCH /api/group/notice
 * - protected route, requires valid Firebase ID token and group manager role
 */
async function updateGroupPaymentNotice(req, res) {
	const logCtx = getLogContext(req);
	const { paymentNotice } = req.body;

	logger.info("Update group payment notice attempt", {
		...logCtx,
		paymentNotice,
	});

	if (typeof paymentNotice !== "string") {
		return res.status(400).json({
			success: false,
			message: "paymentNotice is required",
		});
	}

	try {
		const group = await groupModel.findOne({ managerID: req.user._id });

		if (!group) {
			return res.status(404).json({
				success: false,
				message: "Group not found for the manager",
			});
		}

		group.paymentNotice = paymentNotice.trim();
		await group.save();

		logger.info("Update group payment notice success", {
			...logCtx,
			groupId: group._id,
			paymentNotice: group.paymentNotice,
		});

		return res.status(200).json({
			success: true,
			message: "Payment notice updated successfully",
			group,
		});
	} catch (error) {
		logger.error("Update group payment notice failed", {
			...logCtx,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while updating payment notice",
		});
	}
}

/**
 * - revoke an invited email before joining
 * - POST /api/groups/revoke-invite
 * - protected route, requires valid Firebase ID token and group manager role
 */
async function revokeInvite(req, res) {
	const logCtx = getLogContext(req);
	const { email } = req.body;

	logger.info("Revoke invite attempt", {
		...logCtx,
		email,
	});

	if (!email) {
		return res.status(400).json({
			success: false,
			message: "email is required",
		});
	}

	try {
		const group = await groupModel
			.findOne({ managerID: req.user._id })
			.select("+invitedEmails");

		if (!group) {
			return res.status(404).json({
				success: false,
				message: "Group not found for the manager",
			});
		}

		group.invitedEmails.pull(String(email).trim().toLowerCase());
		await group.save();

		logger.info("Revoke invite success", {
			...logCtx,
			email,
			groupId: group._id,
		});

		return res.status(200).json({
			success: true,
			message: "Invite revoked successfully",
			group,
		});
	} catch (error) {
		logger.error("Revoke invite failed", {
			...logCtx,
			email,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while revoking invite",
		});
	}
}

/**
 * - get group details for a member
 * - GET /api/groups/details/:groupId
 * - protected route, requires valid Firebase ID token and group membership
 */
async function getGroupDetailsForMember(req, res) {
	const logCtx = getLogContext(req);
	const { groupId } = req.params;

	logger.info("Get group details (member) attempt", {
		...logCtx,
		groupId,
	});

	try {
		const group = await groupModel
			.findOne({
				_id: groupId,
				userIDs: req.user._id,
			})
			.populate("managerID", "email displayName");

		if (!group) {
			logger.warn("Get group details (member) failed: not authorized", {
				...logCtx,
				groupId,
				userId: req.user._id,
			});

			return res.status(404).json({
				success: false,
				message:
					"Group not found or you are not a member of this group",
			});
		}

		logger.info("Get group details (member) success", {
			...logCtx,
			groupId: group._id,
			groupTitle: group.title,
		});

		return res.status(200).json({
			success: true,
			message: "Group details retrieved successfully",
			groupTitle: group.title,
			groupAddress: group.address,
			manager: group.managerID,
		});
	} catch (error) {
		logger.error("Get group details (member) failed", {
			...logCtx,
			groupId,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while retrieving group details",
		});
	}
}

/**
 * - update the group title for the manager
 * - PATCH /api/group/title
 * - protected route, requires valid Firebase ID token and group manager role
 */
async function updateGroupTitle(req, res) {
	const logCtx = getLogContext(req);
	const { title } = req.body;

	logger.info("Update group title attempt", {
		...logCtx,
		title,
	});

	if (!title || String(title).trim() === "") {
		return res.status(400).json({
			success: false,
			message: "title is required",
		});
	}

	try {
		const group = await groupModel.findOne({ managerID: req.user._id });

		if (!group) {
			return res.status(404).json({
				success: false,
				message: "Group not found for the manager",
			});
		}

		group.title = String(title).trim();
		await group.save();

		logger.info("Update group title success", {
			...logCtx,
			groupId: group._id,
			title: group.title,
		});

		return res.status(200).json({
			success: true,
			message: "Group title updated successfully",
			group,
		});
	} catch (error) {
		logger.error("Update group title failed", {
			...logCtx,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while updating group title",
		});
	}
}

/**
 * - allow a member to leave their group
 * - POST /api/group/leave
 * - protected route, requires valid Firebase ID token and group membership
 */
async function leaveGroup(req, res) {
	const logCtx = getLogContext(req);

	logger.info("Leave group attempt", {
		...logCtx,
		userId: req.user._id,
		email: req.user.email,
	});

	const session = await mongoose.startSession();

	try {
		await session.withTransaction(async () => {
			const group = await groupModel
				.findOne({
					$or: [
						{ managerID: req.user._id },
						{ userIDs: req.user._id },
					],
				})
				.select("+invitedEmails")
				.session(session);

			if (!group) {
				throw new Error("Group not found for the user");
			}

			if (String(group.managerID) === String(req.user._id)) {
				throw new Error(
					"Manager cannot leave the group before transferring the manager role",
				);
			}

			group.userIDs.pull(req.user._id);
			if (group.invitedEmails?.pull) {
				group.invitedEmails.pull(req.user.email);
			}
			await group.save({ session });
			await unlockRoleChoiceIfNoGroup(req.user._id, session);

			logger.info("Leave group success", {
				...logCtx,
				groupId: group._id,
				userId: req.user._id,
			});

			return res.status(200).json({
				success: true,
				message: "Left the group successfully",
				group: null,
			});
		});
	} catch (error) {
		logger.error("Leave group failed", {
			...logCtx,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: String(error?.message || "").includes("Group not found")
				? "Group not found for the user"
				: String(error?.message || "").includes(
							"transferring the manager role",
					  )
					? "Manager cannot leave the group before transferring the manager role"
					: "An error occurred while leaving the group",
		});
	} finally {
		await session.endSession();
	}
}

/**
 * - change the manager role to another user in the group
 * - POST /api/groups/change-role
 * - protected route, requires valid Firebase ID token and group manager role
 */
async function chengeUserRole(req, res) {
	const logCtx = getLogContext(req);
	const { userId } = req.body;

	logger.info("Change user role attempt", {
		...logCtx,
		targetUserId: userId,
	});

	if (!userId) {
		logger.warn("Change user role failed: missing userId", {
			...logCtx,
		});

		return res.status(400).json({
			success: false,
			message: "userId is required",
		});
	}

	const session = await mongoose.startSession();
	let transferResult = null;

	try {
		await session.withTransaction(async () => {
			// 🔹 Get group inside transaction
			const group = await groupModel.findOne(
				{ managerID: req.user._id },
				null,
				{ session },
			);

			if (!group) {
				logger.warn("Change user role failed: user not group manager", {
					...logCtx,
					userId: req.user._id,
				});

				throw new Error("Only managers can change roles");
			}

			if (group.managerID.toString() === userId) {
				logger.warn("Change user role failed: cannot change own role", {
					...logCtx,
					groupId: group._id,
				});

				throw new Error("You cannot change your own role");
			}

			// 🔹 Get target user
			const user = await userModel.findById(userId, null, { session });

			if (!user) {
				logger.warn("Change user role failed: target user not found", {
					...logCtx,
					targetUserId: userId,
				});

				throw new Error("User not found");
			}

			// 🔹 Check membership
			const isMember = group.userIDs.some(
				(id) => id.toString() === user._id.toString(),
			);

			if (!isMember) {
				logger.warn(
					"Change user role failed: target user not group member",
					{
						...logCtx,
						groupId: group._id,
						targetUserId: userId,
					},
				);

				throw new Error("User is not a group member");
			}

			// 🔥 Get current manager (old)
			const oldManager = await userModel.findById(group.managerID, null, {
				session,
			});

			if (!oldManager) {
				throw new Error("Current manager not found");
			}

			logger.debug("Change user role: updating roles", {
				...logCtx,
				groupId: group._id,
				newManagerId: user._id,
				oldManagerId: oldManager._id,
			});

			// 🔁 Role switch
			user.role = "MANAGER";
			user.roleSelectionCompleted = true;
			user.canBePromoted = false;
			await user.save({ session });

			oldManager.role = "USER";
			oldManager.roleSelectionCompleted = true;
			oldManager.canBePromoted = false;
			await oldManager.save({ session });

			// 🔁 Update group
			group.managerID = user._id;
			group.userIDs.pull(user._id);
			group.userIDs.addToSet(oldManager._id);
			await group.save({ session });

			logger.info("Change user role success", {
				...logCtx,
				groupId: group._id,
				newManagerId: user._id,
				previousManagerId: oldManager._id,
			});

			transferResult = {
				newManager: user,
				newManagerEmail: user.email,
				newManagerName: user.displayName,
				oldManagerEmail: oldManager.email,
				oldManagerName: oldManager.displayName,
				groupTitle: group.title,
			};
		});

		if (transferResult?.newManagerEmail) {
			emailService
				.sendRoleTransferEmail(
					transferResult.newManagerEmail,
					transferResult.newManagerName,
					transferResult.groupTitle,
					true,
				)
				.catch((error) => {
					logger.error("Change user role: new manager email failed", {
						...logCtx,
						email: transferResult.newManagerEmail,
						error: getErrorMeta(error),
					});
				});
		}

		if (transferResult?.oldManagerEmail) {
			emailService
				.sendRoleTransferEmail(
					transferResult.oldManagerEmail,
					transferResult.oldManagerName,
					transferResult.groupTitle,
					false,
				)
				.catch((error) => {
					logger.error(
						"Change user role: previous manager email failed",
						{
							...logCtx,
							email: transferResult.oldManagerEmail,
							error: getErrorMeta(error),
						},
					);
				});
		}

		return res.status(200).json({
			success: true,
			message: "Role transferred successfully",
			newManager: transferResult.newManager,
		});
	} catch (error) {
		logger.error("Change user role failed", {
			...logCtx,
			targetUserId: userId,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while changing user role",
		});
	} finally {
		await session.endSession();
	}
}

module.exports = {
	createGroup,
	sendJoinCode,
	joinByJoinCode,
	removeUserFromGroup,
	getGroupDetails,
	getGroupDetailsForMember,
	revokeInvite,
	updateGroupTitle,
	updateGroupPaymentNotice,
	leaveGroup,
	chengeUserRole,
};
