const Menu = require("../models/menu.model");
const User = require("../models/user.model");

exports.createMenu = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    const menu = await Menu.create({
      userID: user._id,
      ...req.body,
    });

    res.status(201).json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getMenus = async (req, res) => {
  try {
    const menus = await Menu.find(req.query).populate("userID", "displayName email");
    res.json({ success: true, data: menus });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.updateMenu = async (req, res) => {
  try {
    const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.deleteMenu = async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};