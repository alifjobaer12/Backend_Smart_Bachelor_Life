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


module.exports = router;