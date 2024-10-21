const express = require("express");
const {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
} = require("./Review.controller");

const reviewRouter = express.Router();

reviewRouter.post("/", createReview);
reviewRouter.get("/", getReviews);
reviewRouter.get("/:id", getReviewById);
reviewRouter.put("/:id", updateReview);
reviewRouter.delete("/:id", deleteReview);

module.exports = reviewRouter;
