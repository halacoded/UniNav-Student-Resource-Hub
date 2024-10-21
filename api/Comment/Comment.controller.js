const Comment = require("../../models/Comment");
const Course = require("../../models/Course");

// Get all comments for a specific course
exports.getCommentsForCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const comments = await Comment.find({
      course: courseId,
      parentComment: null,
    })
      .sort("-createdAt")
      .populate("user", "username")
      .populate({
        path: "replies",
        populate: { path: "user", select: "username" },
      });

    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

// Create a new comment
exports.createComment = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const newComment = new Comment({
      user: userId,
      course: courseId,
      content,
    });

    await newComment.save();

    // Update the course's comments array
    await Course.findByIdAndUpdate(courseId, {
      $push: { comments: newComment._id },
    });

    res.status(201).json(newComment);
  } catch (error) {
    next(error);
  }
};

// Delete a comment
exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this comment" });
    }

    await Comment.findByIdAndDelete(commentId);

    // Update the course's comments array
    await Course.findByIdAndUpdate(comment.course, {
      $pull: { comments: commentId },
    });

    // Also delete all replies to this comment
    await Comment.deleteMany({ parentComment: commentId });

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Reply to a comment
exports.replyToComment = async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    // Check if the parent comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      return res.status(404).json({ message: "Parent comment not found" });
    }

    // Create the new reply
    const newReply = new Comment({
      user: userId,
      course: parentComment.course,
      content,
      parentComment: commentId,
    });

    // Save the new reply
    await newReply.save();

    // Add the reply to the parent comment's replies array
    await Comment.findByIdAndUpdate(commentId, {
      $push: { replies: newReply._id },
    });

    // Update the course's comments array
    await Course.findByIdAndUpdate(parentComment.course, {
      $push: { comments: newReply._id },
    });

    // Populate user information for the response
    await newReply.populate("user", "username");

    res.status(201).json(newReply);
  } catch (error) {
    console.error("Error in replyToComment:", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Invalid input", details: error.errors });
    }
    next(error);
  }
};
