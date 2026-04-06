const { ImageKit } = require("@imagekit/nodejs");

const envConfig = require("../config/env.config");
const { logger, getErrorMeta } = require("../utils/logger.util");

// Initialize ImageKit client with credentials from environment variables
const imagekitClint = new ImageKit({
	privateKey: envConfig.IMAGEKIT_PRIVATE_KEY,
	publicKey: envConfig.IMAGEKIT_PUBLIC_KEY,
	urlEndpoint: envConfig.IMAGEKIT_URL_ENDPOINT,
});

/**
 * Uploads a file to ImageKit and returns the result.
 * @param {string} catagory - The category/folder to upload the file to.
 * @param {string} fileName - The name of the file to be uploaded.
 * @param {File} file - The file object containing the buffer to be uploaded.
 */
async function uplodeFile(catagory, fileName, file) {
	if (!catagory || !fileName || !file) {
		throw new Error(
			"Category, file name, and file are required for uploading",
		);
	}

	catagory = String(catagory).trim();
	fileName = String(fileName).trim();

	if (catagory !== "expenses" && catagory !== "bazar") {
		throw new Error(
			"Invalid category. Allowed categories are 'expenses' and 'bazar'",
		);
	}

	const buffer = file.buffer.toString("base64");

	if (!buffer) {
		throw new Error("File buffer is empty");
	}

	try {
		const result = await imagekitClint.files.upload({
			file: buffer,
			fileName: `${fileName}_${Date.now()}`,
			folder: `/SBL/${catagory}`,
		});

		return result;
	} catch (error) {
		logger.error("Error uploading file", {
			error: getErrorMeta(error),
			catagory,
			fileName,
		});
		return null;
	}
}

module.exports = {
	uplodeFile,
};
