const groupModel = require("../models/group.model");
const userModel = require("../models/user.model");

const joinCodeGenerator = require("../utils/joinCodeGenerator.util");

const emailService = require("../services/email.service");

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
		const group = await groupModel.findOne({ joinCode });

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

async function removeUserFromGroup(req, res) {
	const { email } = req.body;

	if (!email) {
		return res.status(400).json({
			success: false,
			message: "email is required to remove a user from the group",
		});
	}

	const group = await groupModel.findOne({
		managerID: req.user._id,
	});

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

module.exports = {
	createGroup,
	sendJoinCode,
	joinByJoinCode,
	removeUserFromGroup,
};
