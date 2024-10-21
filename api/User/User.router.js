const express = require("express");
const usersRouter = express.Router();
const {
  signup,
  signin,
  getMe,
  getAllUsers,
  updateUser,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} = require("./User.controller");
const passport = require("passport");
const upload = require("../../middleware/multer");

const authenticate = passport.authenticate("jwt", { session: false });

// Authentication routes
usersRouter.post("/signup", signup);
usersRouter.post(
  "/signin",
  passport.authenticate("local", { session: false }),
  signin
);

// User routes
usersRouter.get("/me", authenticate, getMe);
usersRouter.get("/all", authenticate, getAllUsers);
usersRouter.put(
  "/update",
  authenticate,
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "backgroundImage", maxCount: 1 },
  ]),
  updateUser
);
// Follow routes
usersRouter.post("/:id/follow", authenticate, followUser);
usersRouter.post("/:id/unfollow", authenticate, unfollowUser);
usersRouter.get("/:id/followers", getFollowers);
usersRouter.get("/:id/following", getFollowing);

module.exports = usersRouter;
