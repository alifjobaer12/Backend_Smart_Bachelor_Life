const Bazar = require("../models/bazar.model");
const User = require("../models/user.model");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

exports.createBazar = async (req, res) => {
  const logCtx = getLogContext(req);
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    const bazar = await Bazar.create({
      userID: user._id,
      ...req.body,
    });

    logger.info("Bazar created", { ...logCtx, bazarId: bazar._id });
    res.status(201).json({ success: true, data: bazar });
  } catch (error) {
    logger.error("Error creating bazar", { ...logCtx, error: getErrorMeta(error) });
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBazar = async (req, res) => {
  const logCtx = getLogContext(req);
  try {
    const bazar = await Bazar.find(req.query).populate("userID", "displayName email");

    logger.info("Bazar fetched", logCtx);
    res.json({ success: true, data: bazar });
  } catch (error) {
    logger.error("Error fetching bazar", { ...logCtx, error: getErrorMeta(error) });
    res.status(500).json({ success: false });
  }
};

exports.updateBazar = async (req, res) => {
  const logCtx = getLogContext(req);
  try {
    const bazar = await Bazar.findByIdAndUpdate(req.params.id, req.body, { new: true });

    logger.info("Bazar updated", { ...logCtx, bazarId: bazar?._id });
    res.json({ success: true, data: bazar });
  } catch (error) {
    logger.error("Error updating bazar", { ...logCtx, error: getErrorMeta(error) });
    res.status(500).json({ success: false });
  }
};

exports.deleteBazar = async (req, res) => {
  const logCtx = getLogContext(req);
  try {
    await Bazar.findByIdAndDelete(req.params.id);

    logger.info("Bazar deleted", logCtx);
    res.json({ success: true });
  } catch (error) {
    logger.error("Error deleting bazar", { ...logCtx, error: getErrorMeta(error) });
    res.status(500).json({ success: false });
  }
};