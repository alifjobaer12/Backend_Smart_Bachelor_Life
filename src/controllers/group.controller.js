const mongoose = require("mongoose");

const groupModel = require("../models/group.model");
const userModel = require("../models/user.model");

const joinCodeGenerator = require("../utils/joinCodeGenerator.util");

const emailService = require("../services/email.service");

/** 
 * Create a new group
 * POST /api/groups
 * Protected route, requires valid Firebase ID token and group manager role
*/
async function createGroup(req, res) {
	const { title, address } = req.body;

	if (!title || !address) {
		return res.status(400).json({
			success: false,
			message: "title and address are required for creating a group",
		});
	}

	const joinCode = await joinCodeGenerator.generateUniqueJoinCode(groupModel);

	try {
		const newGroup = await groupModel.create({
			title,
			address,
			managerID: req.user._id,
			joinCode,
		});
		return res.status(201).json({
			success: true,
			message: "Group created successfully",
			group: newGroup,
		});
	} catch (error) {
		console.error("Error creating group:", error);
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
	const { userList } = req.body;

	if (!userList || !Array.isArray(userList) || userList.length === 0) {
		return res.status(400).json({
			success: false,
			message: "userList is required and should be a non-empty array",
		});
	}

	const group = await groupModel.findOne({
		managerID: req.user._id,
	});

	if (!group) {
		return res.status(403).json({
			success: false,
			message: "Only group managers can send join codes",
		});
	}

	const joinCode = await joinCodeGenerator.generateUniqueJoinCode(groupModel);

	const invalidEmails = [];
	const successfullyInvitedEmails = [];

	for (const email of userList) {
		try {
			const user = await userModel.findOne({ email });

			if (!user) {
				invalidEmails.push(email);
				console.warn(
					`User with email ${email} not found, skipping join code email.`,
				);
				continue;
			}

			await emailService.sendJoinCodeEmail(
				email,
				user.displayName,
				group.title,
				joinCode,
			);
			successfullyInvitedEmails.push(user.email);
		} catch (error) {
			invalidEmails.push(email);
			console.error(`Failed to send join code to ${email}:`, error);
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
	}

	return res.status(200).json({
		success: true,
		message:
			invalidEmails.length > 0
				? "Join codes sent with some failures"
				: "Join codes sent successfully",
		invalidEmails,
	});
}

/**
 * - join a group using a join code
 * - POST /api/groups/join
 * - protected route, requires valid Firebase ID token and group membership
 */
async function joinByJoinCode(req, res) {
	const { joinCode } = req.body;
	const userId = req.user._id;

	if (!joinCode) {
		return res.status(400).json({
			success: false,
			message: "joinCode is required to join a group",
		});
	}

	try {
		// Check if user is already a member of any group
		const userExistsInAnyGroup = await groupModel.findOne({
			userIDs: userId,
		});

		if (userExistsInAnyGroup) {
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
			return res.status(404).json({
				success: false,
				message: "Invalid or expired join code",
			});
		}

		// Check if user was invited by the manager
		const isUserInvited = group.invitedEmails.includes(req.user.email);
		if (!isUserInvited) {
			return res.status(403).json({
				success: false,
				message:
					"You were not invited to join this group by the manager",
			});
		}

		// Add user to the group
		group.userIDs.push(userId);
		await group.save();

		return res.status(200).json({
			success: true,
			message: `Joined group "${group.title}" successfully`,
			group,
		});
	} catch (error) {
		console.error("Error joining group:", error);
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
	const { email } = req.body;

	if (!email) {
		return res.status(400).json({
			success: false,
			message: "email is required to remove a user from the group",
		});
	}

	const group = await groupModel
		.findOne({
			managerID: req.user._id,
		})
		.select("+invitedEmails");

	if (!group) {
		return res.status(403).json({
			success: false,
			message: "Only group managers can remove users from the group",
		});
	}

	try {
		const user = await userModel.findOne({ email });

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User with the provided email not found",
			});
		}

		group.userIDs.pull(user._id);
		group.invitedEmails.pull(user.email); // Optionally remove from invited emails as well
		await group.save();

		emailService.sendUserRemovalEmail(email, user.displayName, group.title);

		return res.status(200).json({
			success: true,
			message: "User removed from the group successfully",
			group,
		});
	} catch (error) {
		console.error("Error removing user from group:", error);
		return res.status(500).json({
			success: false,
			message: "An error occurred while removing the user from the group",
		});
	}
}

/**
 * - get group details for the manager
 * - GET /api/groups/details
 * - protected route, requires valid Firebase ID token and group manager role
 */
async function getGroupDetails(req, res) {
	const group = await groupModel
		.findOne({
			managerID: req.user._id,
		})
		.populate("userIDs", "email displayName");

	if (!group) {
		return res.status(404).json({
			success: false,
			message: "Group not found for the manager",
		});
	}

	return res.status(200).json({
		success: true,
		message: "Group details retrieved successfully",
		group,
	});
}

/**
 * - get group details for a member
 * - GET /api/groups/details/:groupId
 * - protected route, requires valid Firebase ID token and group membership
 */
async function getGroupDetailsForMember(req, res) {
	const { groupId } = req.params;

	const group = await groupModel
		.findOne({
			_id: groupId,
			userIDs: req.user._id,
		})
		.populate("managerID", "email displayName");

	if (!group) {
		return res.status(404).json({
			success: false,
			message: "Group not found or you are not a member of this group",
		});
	}

	return res.status(200).json({
		success: true,
		message: "Group details retrieved successfully",
		groupTitle: group.title,
		groupAddress: group.address,
		manager: group.managerID,
	});
}

/**
 * - change the manager role to another user in the group
 * - POST /api/groups/change-role
 * - protected route, requires valid Firebase ID token and group manager role
 */
async function chengeUserRole(req, res) {
	const { userId } = req.body;

	if (!userId) {
		return res.status(400).json({
			success: false,
			message: "userId is required",
		});
	}

	try {
		await mongoose.connection.transaction(async (session) => {
			// 🔹 Get group inside transaction
			const group = await groupModel.findOne(
				{ managerID: req.user._id },
				null,
				{ session },
			);

			if (!group) {
				throw new Error("Only managers can change roles");
			}

			if (group.managerID.toString() === userId) {
				throw new Error("You cannot change your own role");
			}

			// 🔹 Get target user
			const user = await userModel.findById(userId, null, { session });

			if (!user) {
				throw new Error("User not found");
			}

			// 🔹 Check membership
			const isMember = group.userIDs.some(
				(id) => id.toString() === user._id.toString(),
			);

			if (!isMember) {
				throw new Error("User is not a group member");
			}

			// 🔥 Get current manager (old)
			const oldManager = await userModel.findById(group.managerID, null, {
				session,
			});

			// 🔁 Role switch
			user.role = "MANAGER";
			await user.save({ session });

			oldManager.role = "USER";
			await oldManager.save({ session });

			// 🔁 Update group
			group.managerID = user._id;

			group.userIDs.pull(user._id);
			group.userIDs.addToSet(oldManager._id);

			await group.save({ session });

			res.status(200).json({
				success: true,
				message: "Role transferred successfully",
				newManager: user,
			});
		});
	} catch (error) {
		console.error(error);

		return res.status(500).json({
			success: false,
			message: error.message || "Internal error",
		});
	}
}

module.exports = {
	createGroup,
	sendJoinCode,
	joinByJoinCode,
	removeUserFromGroup,
	getGroupDetails,
	getGroupDetailsForMember,
	chengeUserRole,
};
