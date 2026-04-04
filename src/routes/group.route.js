const express = require("express");
const router = express.Router();

const {
  createGroup,
  joinGroup,
  getMyGroup,
  getGroupMembers,
} = require("../controllers/group.controller");

const {
  authUserMiddleware,
  authManagerMiddleware,
} = require("../middlewares/auth.middleware");

//  Create group (manager)
router.post("/", authUserMiddleware, createGroup);

//  Join group
router.post("/join", authUserMiddleware, joinGroup);
//  Get my group
router.get("/me", authUserMiddleware, getMyGroup);




module.exports = router;