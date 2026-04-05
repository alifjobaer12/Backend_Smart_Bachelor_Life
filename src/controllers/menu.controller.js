const Menu = require("../models/menu.model");
const User = require("../models/user.model");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");

exports.createMenu = async (req, res) => {
  const logCtx = getLogContext(req);
  const { title, items, date } = req.body;

  logger.info("Create menu attempt", {
    ...logCtx,
    title,
    itemsCount: items?.length || 0,
    date,
  });

  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });

    if (!user) {
      logger.warn("User not found in createMenu", logCtx);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const menu = await Menu.create({
      userID: user._id,
      ...req.body,
    });

    logger.info("Menu created", { ...logCtx, menuId: menu._id, userId: user._id });
    res.status(201).json({ success: true, data: menu });
  } catch (error) {
    logger.error("Error creating menu", { ...logCtx, ...req.body, error: getErrorMeta(error) });
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMenus = async (req, res) => {
  const logCtx = getLogContext(req);

  logger.info("Get menus attempt", {
    ...logCtx,
    query: req.query,
  });

  try {
    const menus = await Menu.find(req.query).populate("userID", "displayName email");

    logger.info("Menus fetched", { ...logCtx, count: menus.length });
    res.json({ success: true, data: menus });
  } catch (error) {
    logger.error("Error fetching menus", { ...logCtx, query: req.query, error: getErrorMeta(error) });
    res.status(500).json({ success: false });
  }
};

exports.updateMenu = async (req, res) => {
  const logCtx = getLogContext(req);

  logger.info("Update menu attempt", {
    ...logCtx,
    menuId: req.params.id,
    updates: req.body,
  });

  try {
    const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!menu) {
      logger.warn("Menu not found for update", logCtx);
      return res.status(404).json({ success: false, message: "Not found" });
    }

    logger.info("Menu updated", { ...logCtx, menuId: menu?._id });
    res.json({ success: true, data: menu });
  } catch (error) {
    logger.error("Error updating menu", { ...logCtx, menuId: req.params.id, updates: req.body, error: getErrorMeta(error) });
    res.status(500).json({ success: false });
  }
};

exports.deleteMenu = async (req, res) => {
  const logCtx = getLogContext(req);

  logger.info("Delete menu attempt", {
    ...logCtx,
    menuId: req.params.id,
  });

  try {
    const menu = await Menu.findByIdAndDelete(req.params.id);

    if (!menu) {
      logger.warn("Menu not found for delete", logCtx);
      return res.status(404).json({ success: false });
    }

    logger.info("Menu deleted", { ...logCtx, menuId: menu._id });
    res.json({ success: true });
  } catch (error) {
    logger.error("Error deleting menu", { ...logCtx, menuId: req.params.id, error: getErrorMeta(error) });
    res.status(500).json({ success: false });
  }
};