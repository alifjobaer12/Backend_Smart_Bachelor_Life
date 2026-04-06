const Bazar = require("../models/bazar.model");
const User = require("../models/user.model");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

const storageService = require("../services/storage.service");

//  CREATE BAZAR
exports.createBazar = async (req, res) => {
  const logCtx = getLogContext(req);
  const file = req.file;

  const { groupID,  item, quantity, price, documentURL } = req.body;
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

    // not needed
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    //  VALIDATION (BODY)
    if (!groupID || !date || !documentURL) {  // no need documentURL
      return res.status(400).json({
        success: false,
        message: "groupID, date and documentURL are required",
      });
    }

    // optional safety checks

    if (item && quantity && item.length !== quantity.length) {
      return res.status(400).json({
        success: false,
        message: "item and quantity length must match",
      });
    }

    if (item && price && item.length !== price.length) {
      return res.status(400).json({
        success: false,
        message: "item and price length must match",
      });
    }

    if (!file) {
		logger.warn("Create expense failed: no file uploaded", {
			...logCtx
		});

		return res.status(400).json({
			success: false,
			message: "file is required",
		});
	}

    const documentURL = await storageService.uplodeFile(
          "bazar",
          `bazar_${group._id}`,
          file,
        );
    
        if (!documentURL) {
          logger.error("Expense document upload failed", {
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
      groupID,
      date,
      item,
      quantity,
      price,
      documentURL: documentURL.url,  // use the uploaded file URL
    });

    logger.info("Bazar created", { ...logCtx, bazarId: bazar._id });

    res.status(201).json({
      success: true,
      message: "Bazar item created successfully",
      data: bazar,
    });
  } catch (error) {
    logger.error("Error creating bazar", {
      ...logCtx,
      error: getErrorMeta(error),
    });

    res.status(500).json({
      success: false,
      message: "An error occurred while creating the bazar item",
      error: error.message,
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
    //  VALIDATION (QUERY)
    if (!req.query.groupID) {
      return res.status(400).json({
        success: false,
        message: "groupID query is required",
      });
    }

    const bazar = await Bazar.find({
      groupID: req.query.groupID,
    }).populate("userID", "displayName email");

    logger.info("Bazar fetched", { ...logCtx, count: bazar.length });

    res.status(200).json({
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

    res.status(500).json({
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
    const bazar = await Bazar.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!bazar) {
      logger.warn("Bazar not found for update", logCtx);
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    logger.info("Bazar updated", {
      ...logCtx,
      bazarId: bazar._id,
    });

    res.json({
      success: true,
      data: bazar,
    });
  } catch (error) {
    logger.error("Error updating bazar", {
      ...logCtx,
      bazarId: req.params.id,
      error: getErrorMeta(error),
    });

    res.status(500).json({
      success: false,
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
    const bazar = await Bazar.findByIdAndDelete(req.params.id);

    if (!bazar) {
      logger.warn("Bazar not found for delete", logCtx);
      return res.status(404).json({
        success: false,
      });
    }

    logger.info("Bazar deleted", {
      ...logCtx,
      bazarId: bazar._id,
    });

    res.json({
      success: true,
    });
  } catch (error) {
    logger.error("Error deleting bazar", {
      ...logCtx,
      bazarId: req.params.id,
      error: getErrorMeta(error),
    });

    res.status(500).json({
      success: false,
    });
  }
};