const Bazar = require("../models/bazar.model");

//  Create Bazar Entry
exports.createBazar = async (req, res) => {
  try {
    const userID = req.user.uid; //  (firebase)
    const { groupID, date, item, quantity, price, documentURL } = req.body;

    const bazar = await Bazar.create({
      userID,
      groupID,
      date,
      item,
      quantity,
      price,
      documentURL,
    });

    res.status(201).json({
      success: true,
      message: "Bazar entry created successfully",
      data: bazar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create bazar entry",
      error: error.message,
    });
  }
};

//  Get Bazar Entries
exports.getBazar = async (req, res) => {
  try {
    const { groupID, date } = req.query;

    const query = { groupID };
    if (date) query.date = date;

    const bazars = await Bazar.find(query).populate("userID", "displayName email");

    res.status(200).json({
      success: true,
      data: bazars,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch bazar entries",
      error: error.message,
    });
  }
};

//  Update Bazar Entry
exports.updateBazar = async (req, res) => {
  try {
    const { id } = req.params;
    const { item, quantity, price, documentURL } = req.body;

    const bazar = await Bazar.findByIdAndUpdate(
      id,
      { item, quantity, price, documentURL },
      { new: true }
    );

    if (!bazar) {
      return res.status(404).json({
        success: false,
        message: "Bazar entry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bazar updated successfully",
      data: bazar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update bazar",
      error: error.message,
    });
  }
};

//  Delete Bazar Entry
exports.deleteBazar = async (req, res) => {
  try {
    const { id } = req.params;

    const bazar = await Bazar.findByIdAndDelete(id);

    if (!bazar) {
      return res.status(404).json({
        success: false,
        message: "Bazar entry not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Bazar deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete bazar",
      error: error.message,
    });
  }
};

//  Total Bazar Cost (IMPORTANT for expense)
exports.getBazarSummary = async (req, res) => {
  try {
    const { groupID } = req.query;

    const bazars = await Bazar.find({ groupID });

    let totalCost = 0;

    bazars.forEach((b) => {
      b.price.forEach((p) => {
        totalCost += p;
      });
    });

    res.status(200).json({
      success: true,
      data: {
        totalCost,
        totalEntries: bazars.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to calculate bazar summary",
      error: error.message,
    });
  }
};