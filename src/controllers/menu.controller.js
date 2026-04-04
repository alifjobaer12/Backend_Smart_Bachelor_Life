const Menu = require("../models/menu.model");

// Creating Menu
exports.createMenu = async (req, res) => {
  try {
    const userID = req.user.uid;
    const { groupID, date, breakfast, lunch, dinner } = req.body;

    const menu = await Menu.create({
      userID,
      groupID,
      date,
      breakfast,
      lunch,
      dinner,
    });

    res.status(201).json({
      success: true,
      message: "Menu created successfully",
      data: menu,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create menu",
      error: error.message,
    });
  }
};

// Get Menus
exports.getMenus = async (req, res) => {
  try {
    const { groupID, date } = req.query;

    const query = { groupID };
    if (date) query.date = date;

    const menus = await Menu.find(query).populate("userID", "displayName email");

    res.status(200).json({
      success: true,
      data: menus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch menus",
      error: error.message,
    });
  }
};
