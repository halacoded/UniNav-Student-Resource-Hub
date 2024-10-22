const Review = require("../../models/Review");

exports.createReview = async (req, res) => {
  try {
    const { user, professor, course, stars, comments } = req.body;

    const newReview = new Review({
      user,
      professor,
      course,
      stars,
      comments,
    });

    await newReview.save();
    res
      .status(201)
      .json({ message: "Review created successfully", review: newReview });
  } catch (err) {
    console.error("Create review error:", err);
    res
      .status(500)
      .json({ message: "Error creating review", error: err.message });
  }
};

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("user")
      .populate("professor")
      .populate("course")
      .populate("comments.user");
    res.status(200).json(reviews);
  } catch (err) {
    console.error("Get reviews error:", err);
    res
      .status(500)
      .json({ message: "Error fetching reviews", error: err.message });
  }
};

exports.getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate("user")
      .populate("professor")
      .populate("course")
      .populate("comments.user");
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.status(200).json(review);
  } catch (err) {
    console.error("Get review by ID error:", err);
    res
      .status(500)
      .json({ message: "Error fetching review", error: err.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { stars, comments } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    review.stars = stars || review.stars;
    review.comments = comments || review.comments;

    await review.save();
    res.status(200).json({ message: "Review updated successfully", review });
  } catch (err) {
    console.error("Update review error:", err);
    res
      .status(500)
      .json({ message: "Error updating review", error: err.message });
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const deletedReview = await Review.findByIdAndDelete(req.params.id);
    if (!deletedReview) {
      return res.status(404).json({ message: "Review not found" });
    }

    const user = deletedReview.user;
    const professor = deletedReview.professor;
    const course = deletedReview.course;

    // Remove the review reference from the user
    await User.findByIdAndUpdate(user, {
      $pull: { reviews: deletedReview._id },
    });

    // Remove the review reference from the professor
    await Professor.findByIdAndUpdate(professor, {
      $pull: { reviews: deletedReview._id },
    });

    // Remove the review reference from the course
    await Course.findByIdAndUpdate(course, {
      $pull: { reviews: deletedReview._id },
    });

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    next(error);
  }
};
