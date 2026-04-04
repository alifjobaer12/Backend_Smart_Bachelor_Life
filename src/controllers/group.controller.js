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

    // generate unique code , unique code rendering hocche
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

    //  duplicate join check
    if (group.users.includes(user._id)) {
      return res.status(400).json({
        success: false,
        message: "User already in group",
      });
    }

    group.users.push(user._id);
    await group.save();

    res.status(200).json({
      success: true,
      message: "Joined group successfully",
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to join group",
      error: error.message,
    });
  }
};

//  Get My Group
exports.getMyGroup = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    const group = await Group.findOne({
      users: user._id,
    }).populate("users", "displayName email");

    res.status(200).json({
      success: true,
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch group",
      error: error.message,
    });
  }
};

//  Get Group Members
exports.getGroupMembers = async (req, res) => {
  try {
    const { groupID } = req.params;

    const group = await Group.findById(groupID).populate(
      "users",
      "displayName email"
    );

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    res.status(200).json({
      success: true,
      data: group.users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch members",
      error: error.message,
    });
  }
};