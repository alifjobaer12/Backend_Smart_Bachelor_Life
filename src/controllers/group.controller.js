const Group = require("../models/group.model");
const User = require("../models/user.model");

//  Create Group (manager)
exports.createGroup = async (req, res) => {
  try {
    //  Fixing map firebase to DB user
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }


    const { title, address } = req.body;

    // generate unique code , unique code rendering hocche 6 character er, random string, uppercase, alphanumeric
    const uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const group = await Group.create({
      title,
      address,
      manager: user._id,
      users: [user._id],
      uniqueCode,
    });

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create group",
      error: error.message,
    });
  }
};

//  Join Group
exports.joinGroup = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const { code } = req.body;

    const group = await Group.findOne({ uniqueCode: code });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Invalid group code",
      });
    }
