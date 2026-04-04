const crypto = require("crypto");

/**
 * - generate a unique join code for a group
 * - the code is in the format "SBL-XXXXXX" where X is a random hexadecimal character
 * - the function checks the database to ensure the generated code is unique
 * @param {Mongoose Model} model - the Mongoose model to check for existing join codes
 * @returns {string} - a unique join code
 */
async function generateUniqueJoinCode(model) {
	let code;
	let exists = true;

	while (exists) {
		code = `SBL-` + crypto.randomBytes(3).toString("hex").toUpperCase();

		const found = await model.findOne({ joinCode: code });

		if (!found) exists = false;
	}
	return code;
}

module.exports = {
	generateUniqueJoinCode,
};
