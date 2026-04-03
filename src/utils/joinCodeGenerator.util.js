const crypto = require("crypto");

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
