const Menu = require("../models/menu.model");
const User = require("../models/user.model");
const { logger, getLogContext, getErrorMeta } = require("../utils/logger.util");


//  CREATE MENU
exports.createMenu = async (req, res) => {
  const logCtx = getLogContext(req);

  //  correct fields from model
  const { groupID, date, breakfast, lunch, dinner } = req.body;

  logger.info("Create menu attempt", {
    ...logCtx,
    groupID,
    date,
  });

  try {
    const user = await User.findOne({ firebaseUid: req.user.firebaseUid });

    if (!user) {
      logger.warn("User not found in createMenu", logCtx);
      return res.status(404).json({ success: false, message: "User not found" });
    }

    //  validation
    if (!groupID) {
      return res.status(400).json({
        success: false,
        message: "groupID is required",
      });
    }

    const menu = await Menu.create({
      userID: user._id,
      groupID,
      date: date || new Date(), //  fixed date logic
      breakfast,
      lunch,
      dinner,
    });

    logger.info("Menu created", { ...logCtx, menuId: menu._id, userId: user._id });

    res.status(201).json({
      success: true,
      data: menu,
    });

  } catch (error) {
    logger.error("Error creating menu", {
      ...logCtx,
      error: getErrorMeta(error),
    });

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};



//  GET MENUS
exports.getMenus = async (req, res) => {
  const logCtx = getLogContext(req);

  logger.info("Get menus attempt", {
    ...logCtx,
    query: req.query,
  });

  try {
    //  validation
    if (!req.query.groupID) {
      return res.status(400).json({
        success: false,
        message: "groupID query is required",
      });
    }

    const menus = await Menu.find({
      groupID: req.query.groupID,
    }).populate("userID", "displayName email");

    logger.info("Menus fetched", { ...logCtx, count: menus.length });

    res.json({
      success: true,
      data: menus,
    });

  } catch (error) {
    logger.error("Error fetching menus", {
      ...logCtx,
      error: getErrorMeta(error),
    });

    res.status(500).json({
      success: false,
    });
  }
};



//  UPDATE MENU
exports.updateMenu = async (req, res) => {
  const logCtx = getLogContext(req);

  logger.info("Update menu attempt", {
    ...logCtx,
    menuId: req.params.id,
    updates: req.body,
  });

  try {
    const { breakfast, lunch, dinner } = req.body;

    const menu = await Menu.findByIdAndUpdate(
      req.params.id,
      { breakfast, lunch, dinner }, //  controlled update
      { new: true }
    );

    if (!menu) {
      logger.warn("Menu not found for update", logCtx);
      return res.status(404).json({
        success: false,
        message: "Not found",
      });
    }

    logger.info("Menu updated", { ...logCtx, menuId: menu._id });

    res.json({
      success: true,
      data: menu,
    });

  } catch (error) {
    logger.error("Error updating menu", {
      ...logCtx,
      error: getErrorMeta(error),
    });

    res.status(500).json({
      success: false,
    });
  }
};



//  DELETE MENU
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
      return res.status(404).json({
        success: false,
      });
    }

    logger.info("Menu deleted", { ...logCtx, menuId: menu._id });

    res.json({
      success: true,
    });

  } catch (error) {
    logger.error("Error deleting menu", {
      ...logCtx,
      error: getErrorMeta(error),
    });

    res.status(500).json({
      success: false,
    });
  }
};