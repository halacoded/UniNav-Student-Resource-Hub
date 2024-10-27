const express = require("express");
const communityRouter = express.Router();

const {
  getAllCommunities,
  getCommunityById,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  requestToJoinCommunity,
  approveJoinRequest,
  leaveCommunity,
} = require("./Community.controller");
const upload = require("../../middleware/multer");
const passport = require("passport");
const authenticate = passport.authenticate("jwt", { session: false });
// Community routes
communityRouter.get("/", getAllCommunities);
communityRouter.get("/:id", authenticate, getCommunityById);
communityRouter.post(
  "/",
  authenticate,
  upload.single("profileImage"),
  createCommunity
);
communityRouter.put(
  "/:id",
  authenticate,
  upload.single("profileImage"),
  updateCommunity
);
communityRouter.delete("/:id", authenticate, deleteCommunity);

// Join request routes
communityRouter.post("/:id/request", authenticate, requestToJoinCommunity);
communityRouter.post("/:id/approve/:userId", authenticate, approveJoinRequest);

communityRouter.delete("/:id/leave", authenticate, leaveCommunity); // Added leaveCommunity route

module.exports = communityRouter;
