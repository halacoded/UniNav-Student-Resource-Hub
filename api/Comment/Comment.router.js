const express = require("express");
const passport = require("passport");
const {
  getComments,
  createComment,
  deleteComment,
  replyToComment,
} = require("./Comment.controller");

const commentRouter = express.Router();

// Get all comments for a specific course or professor
commentRouter.get("/:type/:id", getComments);

// Create a new comment
commentRouter.post(
  "/:type/:id",
  passport.authenticate("jwt", { session: false }),
  createComment
);

// Delete a comment
commentRouter.delete(
  "/:commentId",
  passport.authenticate("jwt", { session: false }),
  deleteComment
);

// Reply to a comment
commentRouter.post(
  "/:commentId",
  passport.authenticate("jwt", { session: false }),
  replyToComment
);

module.exports = commentRouter;
