const express = require("express");




const {
  createBazar,
  getBazar,
  updateBazar,
  deleteBazar,
} = require("../controllers/bazar.controller");

const {
  authUserMiddleware,
  authManagerMiddleware,
} = require("../middlewares/auth.middleware");


//document url upload and save
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const bazarRouter = express.Router();



// Create (manager)
/**
 * - create a new bazar item
 * - POST /api/bazar
 * - protected route, requires valid Firebase ID token and group manager role
 * - expects multipart/form-data with field: file
 */
bazarRouter.post("/", authManagerMiddleware,upload.single("file"), createBazar);


// Read (all users)
/**
 * - get bazar items
 * - GET /api/bazar
 * - protected route, requires valid Firebase ID token
 */
bazarRouter.get("/", authUserMiddleware, getBazar);

// Update (manager)
/**
 * - update a bazar item
 * - PATCH /api/bazar/:id
 * - protected route, requires valid Firebase ID token and group manager role
 */
bazarRouter.patch("/:id", authManagerMiddleware, updateBazar);

// Delete (manager)
/**
 * - delete a bazar item
 * - DELETE /api/bazar/:id
 * - protected route, requires valid Firebase ID token and group manager role
 */
bazarRouter.delete("/:id", authManagerMiddleware, deleteBazar);

module.exports = bazarRouter;