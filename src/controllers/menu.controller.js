const Menu = require("../models/menu.model");
const User = require("../models/user.model");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

exports.createMenu = async (req, res) => {
  const logCtx = getLogContext(req);
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    const menu = await Menu.create({
      userID: user._id,
      ...req.body,
    });

    logger.info("Menu created", { ...logCtx, menuId: menu._id });
    res.status(201).json({ success: true, data: menu });
  } catch (error) {
    logger.error("Error creating menu", { ...logCtx, error: getErrorMeta(error) });
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMenus = async (req, res) => {
  const logCtx = getLogContext(req);
  try {
    const menus = await Menu.find(req.query).populate("userID", "displayName email");

    logger.info("Menus fetched", logCtx);
    res.json({ success: true, data: menus });
  } catch (error) {
    logger.error("Error fetching menus", { ...logCtx, error: getErrorMeta(error) });
    res.status(500).json({ success: false });
  }
};

exports.updateMenu = async (req, res) => {
  const logCtx = getLogContext(req);
  try {
    const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });

    logger.info("Menu updated", { ...logCtx, menuId: menu?._id });
    res.json({ success: true, data: menu });
  } catch (error) {
    logger.error("Error updating menu", { ...logCtx, error: getErrorMeta(error) });
    res.status(500).json({ success: false });
  }
};

exports.deleteMenu = async (req, res) => {
  const logCtx = getLogContext(req);
  try {
    await Menu.findByIdAndDelete(req.params.id);

    logger.info("Menu deleted", logCtx);
    res.json({ success: true });
  } catch (error) {
    logger.error("Error deleting menu", { ...logCtx, error: getErrorMeta(error) });
    res.status(500).json({ success: false });
  }
};