const express = require("express");
const {
  createResource,
  getResources,
  getResourceById,
  deleteResource,
  toggleLikeResource,
  toggleDislikeResource,
} = require("./Resource.controller");
const passport = require("passport");
const upload = require("../../middleware/multer");
const authenticate = passport.authenticate("jwt", { session: false });
const resourceRouter = express.Router();

resourceRouter.post("/", authenticate, upload.single("url"), createResource);
resourceRouter.get("/", getResources);
resourceRouter.get("/:id", getResourceById);

resourceRouter.delete("/:id", authenticate, deleteResource);
resourceRouter.post("/:id/like", authenticate, toggleLikeResource);
resourceRouter.post("/:id/dislike", authenticate, toggleDislikeResource);

module.exports = resourceRouter;
