const Bazar = require("../models/bazar.model");
const User = require("../models/user.model");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");



exports.createBazar = async (req, res) => {
  const logCtx = getLogContext(req);
  const { title, amount, category } = req.body;

  const date =  new Date();
  logger.info("Create bazar attempt", {
    ...logCtx,
    title,
    amount,
    category,
    date,
  });

  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });

    const bazar = await Bazar.create({
      userID: user._id,
      ...req.body,
    });

    logger.info("Bazar created", { ...logCtx, bazarId: bazar._id, userId: user._id });
    res.status(201).json({ success: true, data: bazar });
  } catch (error) {
    logger.error("Error creating bazar", { ...logCtx, ...req.body, error: getErrorMeta(error) });
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBazar = async (req, res) => {
  const logCtx = getLogContext(req);

  logger.info("Get bazar attempt", {
    ...logCtx,
    query: req.query,
  });

  try {
    const bazar = await Bazar.find(req.query).populate("userID", "displayName email");

    logger.info("Bazar fetched", { ...logCtx, count: bazar.length });
    res.json({ success: true, data: bazar });
  } catch (error) {
    logger.error("Error fetching bazar", { ...logCtx, query: req.query, error: getErrorMeta(error) });
    res.status(500).json({ success: false });
  }
};

exports.updateBazar = async (req, res) => {
  const logCtx = getLogContext(req);

  logger.info("Update bazar attempt", {
    ...logCtx,
    bazarId: req.params.id,
    updates: req.body,
  });

  try {
    const bazar = await Bazar.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!bazar) {
      logger.warn("Bazar not found for update", logCtx);
      return res.status(404).json({ success: false, message: "Not found" });
    }

    logger.info("Bazar updated", { ...logCtx, bazarId: bazar?._id });
    res.json({ success: true, data: bazar });
  } catch (error) {
    logger.error("Error updating bazar", { ...logCtx, bazarId: req.params.id, updates: req.body, error: getErrorMeta(error) });
    res.status(500).json({ success: false });
  }
};

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
      return res.status(404).json({ success: false });
    }

    logger.info("Bazar deleted", { ...logCtx, bazarId: bazar._id });
    res.json({ success: true });
  } catch (error) {
    logger.error("Error deleting bazar", { ...logCtx, bazarId: req.params.id, error: getErrorMeta(error) });
    res.status(500).json({ success: false });
  }
};