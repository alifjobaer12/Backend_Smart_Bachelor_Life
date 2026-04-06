const Bazar = require("../models/bazar.model");
const User = require("../models/user.model");
const groupModel = require("../models/group.model");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

const storageService = require("../services/storage.service");

function normalizeArrayValue(value) {
	if (value === undefined || value === null || value === "") {
		return [];
	}

	if (Array.isArray(value)) {
		return value;
	}

	return [value];
}

//  CREATE BAZAR
exports.createBazar = async (req, res) => {
	const logCtx = getLogContext(req);
	const file = req.file;
	const { groupID, item, quantity, price } = req.body;
	const date = new Date();

	logger.info("Create bazar attempt", {
		...logCtx,
		groupID,
		date,
		item,
		quantity,
		price,
	});

	try {
		const user = await User.findOne({ firebaseUid: req.user.firebaseUid });

		if (!user) {
			return res
				.status(404)
				.json({ success: false, message: "User not found" });
		}

		if (!groupID) {
			return res.status(400).json({
				success: false,
				message: "groupID is required",
			});
		}

		if (!file) {
			logger.warn("Create bazar failed: no file uploaded", {
				...logCtx,
			});

			return res.status(400).json({
				success: false,
				message: "file is required",
			});
		}

		const group = await groupModel.findOne({
			_id: groupID,
			managerID: req.user._id,
		});

		if (!group) {
			return res.status(403).json({
				success: false,
				message:
					"You are not authorized to create bazar items for this group",
			});
		}

		const itemList = normalizeArrayValue(item);
		const quantityList = normalizeArrayValue(quantity).map(Number);
		const priceList = normalizeArrayValue(price).map(Number);

		if (
			itemList.length !== quantityList.length ||
			itemList.length !== priceList.length
		) {
			return res.status(400).json({
				success: false,
				message: "item, quantity, and price length must match",
			});
		}

		const document = await storageService.uplodeFile(
			"bazar",
			`bazar_${group._id}`,
			file,
		);

		if (!document) {
			logger.error("Bazar document upload failed", {
				...logCtx,
				groupId: group._id,
				fileName: file.originalname,
			});

			return res.status(500).json({
				success: false,
				message: "Failed to upload document",
			});
		}

		const bazar = await Bazar.create({
			userID: user._id,
			groupID: group._id,
			date,
			item: itemList,
			quantity: quantityList,
			price: priceList,
			documentURL: document.url,
		});

		logger.info("Bazar created", { ...logCtx, bazarId: bazar._id });

		return res.status(201).json({
			success: true,
			message: "Bazar item created successfully",
			data: bazar,
		});
	} catch (error) {
		logger.error("Error creating bazar", {
			...logCtx,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while creating the bazar item",
		});
	}
};

//  GET BAZAR
exports.getBazar = async (req, res) => {
	const logCtx = getLogContext(req);

	logger.info("Get bazar attempt", {
		...logCtx,
		query: req.query,
	});

	try {
		if (!req.query.groupID) {
			return res.status(400).json({
				success: false,
				message: "groupID query is required",
			});
		}

		const group = await groupModel.findOne({
			_id: req.query.groupID,
			$or: [{ managerID: req.user._id }, { userIDs: req.user._id }],
		});

		if (!group) {
			return res.status(403).json({
				success: false,
				message:
					"You are not authorized to view bazar items for this group",
			});
		}

		const bazar = await Bazar.find({
			groupID: group._id,
		}).populate("userID", "displayName email");

		logger.info("Bazar fetched", { ...logCtx, count: bazar.length });

		return res.status(200).json({
			success: true,
			message: "Bazar items fetched successfully",
			data: bazar,
		});
	} catch (error) {
		logger.error("Error fetching bazar", {
			...logCtx,
			query: req.query,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while fetching bazar items",
		});
	}
};

//  UPDATE BAZAR
exports.updateBazar = async (req, res) => {
	const logCtx = getLogContext(req);

	logger.info("Update bazar attempt", {
		...logCtx,
		bazarId: req.params.id,
		updates: req.body,
	});

	try {
		const bazar = await Bazar.findById(req.params.id);

		if (!bazar) {
			return res.status(404).json({
				success: false,
				message: "Not found",
			});
		}

		const group = await groupModel.findOne({
			_id: bazar.groupID,
			managerID: req.user._id,
		});

		if (!group) {
			return res.status(403).json({
				success: false,
				message: "You are not authorized to update this bazar item",
			});
		}

		const updates = {};
		if (req.body.item !== undefined) {
			updates.item = normalizeArrayValue(req.body.item);
		}
		if (req.body.quantity !== undefined) {
			updates.quantity = normalizeArrayValue(req.body.quantity).map(
				Number,
			);
		}
		if (req.body.price !== undefined) {
			updates.price = normalizeArrayValue(req.body.price).map(Number);
		}
		if (req.body.date !== undefined) {
			updates.date = req.body.date;
		}
		if (req.body.documentURL !== undefined) {
			updates.documentURL = req.body.documentURL;
		}

		if (Object.keys(updates).length === 0) {
			return res.status(400).json({
				success: false,
				message: "No valid fields provided for update",
			});
		}

		const updatedBazar = await Bazar.findByIdAndUpdate(
			req.params.id,
			updates,
			{
				new: true,
			},
		);

		logger.info("Bazar updated", {
			...logCtx,
			bazarId: updatedBazar._id,
		});

		return res.status(200).json({
			success: true,
			data: updatedBazar,
		});
	} catch (error) {
		logger.error("Error updating bazar", {
			...logCtx,
			bazarId: req.params.id,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while updating the bazar item",
		});
	}
};

//  DELETE BAZAR
exports.deleteBazar = async (req, res) => {
	const logCtx = getLogContext(req);

	logger.info("Delete bazar attempt", {
		...logCtx,
		bazarId: req.params.id,
	});

	try {
		const bazar = await Bazar.findById(req.params.id);

		if (!bazar) {
			return res.status(404).json({
				success: false,
				message: "Bazar not found",
			});
		}

		const group = await groupModel.findOne({
			_id: bazar.groupID,
			managerID: req.user._id,
		});

		if (!group) {
			return res.status(403).json({
				success: false,
				message: "You are not authorized to delete this bazar item",
			});
		}

		await Bazar.findByIdAndDelete(req.params.id);

		logger.info("Bazar deleted", {
			...logCtx,
			bazarId: bazar._id,
		});

		return res.status(200).json({
			success: true,
			message: "Bazar deleted successfully",
		});
	} catch (error) {
		logger.error("Error deleting bazar", {
			...logCtx,
			bazarId: req.params.id,
			error: getErrorMeta(error),
		});

		return res.status(500).json({
			success: false,
			message: "An error occurred while deleting the bazar item",
		});
	}
};
