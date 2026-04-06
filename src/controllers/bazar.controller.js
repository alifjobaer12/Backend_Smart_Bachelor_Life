const Bazar = require("../models/bazar.model");
const User = require("../models/user.model");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

//  CREATE BAZAR
exports.createBazar = async (req, res) => {
  const logCtx = getLogContext(req);

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
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    //  VALIDATION (BODY)
    if (!groupID || !date || !documentURL) {
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

    const bazar = await Bazar.create({
      userID: user._id,
      groupID,
      date,
      item,
      quantity,
      price,
      documentURL,
    });

    logger.info("Bazar created", { ...logCtx, bazarId: bazar._id });

    res.status(201).json({
      success: true,
      data: bazar,
    });
  } catch (error) {
    logger.error("Error creating bazar", {
      ...logCtx,
      error: getErrorMeta(error),
    });

    res.status(500).json({
      success: false,
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

    res.json({
      success: true,
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