const Menu = require("../models/menu.model");

// async handler
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ✅ Create Menu
exports.createMenu = asyncHandler(async (req, res) => {
  const userID = req.user.uid; // firebase uid (IMPORTANT)
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
});

// ✅ Get Menus (group + optional date)
exports.getMenus = asyncHandler(async (req, res) => {
  const { groupID, date } = req.query;

  const query = { groupID };

  if (date) query.date = date;

  const menus = await Menu.find(query).populate("userID", "displayName email");

  res.status(200).json({
    success: true,
    data: menus,
  });
});

// ✅ Update Menu
exports.updateMenu = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { breakfast, lunch, dinner } = req.body;

  const menu = await Menu.findByIdAndUpdate(
    id,
    { breakfast, lunch, dinner },
    { new: true }
  );

  if (!menu) {
    return res.status(404).json({
      success: false,
      message: "Menu not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Menu updated successfully",
    data: menu,
  });
});

// ✅ Delete Menu
exports.deleteMenu = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const menu = await Menu.findByIdAndDelete(id);

  if (!menu) {
    return res.status(404).json({
      success: false,
      message: "Menu not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Menu deleted successfully",
  });
});