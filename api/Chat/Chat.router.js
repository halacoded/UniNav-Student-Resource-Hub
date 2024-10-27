const express = require("express");
const passport = require("passport");
const {
  createChat,
  getAllChats,
  getChatById,
  addCommentToChat,
} = require("./Chat.controller");

const chatRouter = express.Router();

// Create a new chat
chatRouter.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  createChat
);

// Get all chats
chatRouter.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  getAllChats
);

// Get a specific chat by ID
chatRouter.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  getChatById
);

// Add a comment to a chat
chatRouter.post(
  "/:id/comments",
  passport.authenticate("jwt", { session: false }),
  addCommentToChat
);

module.exports = chatRouter;
