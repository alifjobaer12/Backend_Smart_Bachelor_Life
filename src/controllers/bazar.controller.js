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
