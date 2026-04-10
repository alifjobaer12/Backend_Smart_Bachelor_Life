const multer = require("multer");

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

function uploadSingleFile(fieldName) {
	const upload = multer({
		storage: multer.memoryStorage(),
		limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
	});

	return function singleFileUploadMiddleware(req, res, next) {
		upload.single(fieldName)(req, res, (error) => {
			if (!error) {
				return next();
			}

			if (
				error instanceof multer.MulterError &&
				error.code === "LIMIT_FILE_SIZE"
			) {
				return res.status(413).json({
					success: false,
					message: "File too large. Maximum allowed size is 5MB",
				});
			}

			return res.status(400).json({
				success: false,
				message: "Invalid file upload",
			});
		});
	};
}

module.exports = {
	uploadSingleFile,
};
