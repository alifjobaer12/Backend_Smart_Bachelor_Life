const Bazar = require("../models/bazar.model");
const User = require("../models/user.model");

exports.createBazar = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });

    const bazar = await Bazar.create({
      userID: user._id,
      ...req.body,
    });

    res.status(201).json({ success: true, data: bazar });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getBazar = async (req, res) => {
  try {
    const bazar = await Bazar.find(req.query).populate("userID", "displayName email");
    res.json({ success: true, data: bazar });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.updateBazar = async (req, res) => {
  try {
    const bazar = await Bazar.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: bazar });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.deleteBazar = async (req, res) => {
  try {
    await Bazar.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};