const userModel = require("../models/user.model");

/**
 * - user registration controller
 * - POST /api/auth/register
 * - open to public
 */
async function userRegisterController(req, res) {
	const {
		firebaseUid,
		email,
		displayName,
		photoURL,
		role,
		provider,
		lastLoginAt,
	} = req.body;

	const isExistingUser = await userModel.findOne({
		$or: [{ firebaseUid }, { email }],
	});

	if (isExistingUser) {
		return res.status(422).json({
			success: false,
			message:
				"User with the provided firebaseUid or email already exists",
		});
	}

	try {
		// Create a new user document in MongoDB
		const newUser = await userModel.create({
			firebaseUid,
			email,
			displayName,
			photoURL,
			role,
			provider,
			lastLoginAt,
		});

		return res.status(201).json({
			success: true,
			message: "User registered successfully",
			user: newUser,
		});
	} catch (error) {
		console.error("Error registering user:", error);
		return res.status(500).json({
			success: false,
			message: "An error occurred while registering the user",
		});
	}
}

module.exports = {
	userRegisterController,
};
