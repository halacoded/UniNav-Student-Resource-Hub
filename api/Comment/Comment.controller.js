const Comment = require("../../models/Comment");
const Course = require("../../models/Course");
const Professor = require("../../models/Professor");

// Get all comments for a specific course or professor
exports.getComments = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const filter = { parentComment: null };

    if (type === "course") {
      filter.course = id;
    } else if (type === "professor") {
      filter.professor = id;
    } else {
      return res.status(400).json({ message: "Invalid type" });
    }

    const comments = await Comment.find(filter)
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
    const { type, id } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    let newComment;
    if (type === "course") {
      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      newComment = new Comment({
        user: userId,
        course: id,
        content,
        commentType: "course",
      });
      await Course.findByIdAndUpdate(id, {
        $push: { comments: newComment._id },
      });
    } else if (type === "professor") {
      const professor = await Professor.findById(id);
      if (!professor) {
        return res.status(404).json({ message: "Professor not found" });
      }
      newComment = new Comment({
        user: userId,
        professor: id,
        content,
        commentType: "professor",
      });
      await Professor.findByIdAndUpdate(id, {
        $push: { comments: newComment._id },
      });
    } else {
      return res.status(400).json({ message: "Invalid type" });
    }

    await newComment.save();
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

    // Update the course or professor's comments array
    if (comment.commentType === "course") {
      await Course.findByIdAndUpdate(comment.course, {
        $pull: { comments: commentId },
      });
    } else if (comment.commentType === "professor") {
      await Professor.findByIdAndUpdate(comment.professor, {
        $pull: { comments: commentId },
      });
    }

    // Also delete all replies to this comment
    await Comment.deleteMany({ parentComment: commentId });

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    next(error);
  }
};
exports.replyToComment = async (req, res, next) => {
  try {
    console.log("HI");
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
      content,
      parentComment: commentId,
      commentType: parentComment.commentType,
      course: parentComment.course,
      professor: parentComment.professor,
    });

    // Save the new reply
    await newReply.save();

    // Add the reply to the parent comment's replies array
    await Comment.findByIdAndUpdate(commentId, {
      $push: { replies: newReply._id },
    });

    // Update the course or professor's comments array
    if (parentComment.commentType === "course") {
      await Course.findByIdAndUpdate(parentComment.course, {
        $push: { comments: newReply._id },
      });
    } else if (parentComment.commentType === "professor") {
      await Professor.findByIdAndUpdate(parentComment.professor, {
        $push: { comments: newReply._id },
      });
    }

    // Populate user information for the response
    await newReply.populate("user", "username");

    res.status(201).json(newReply);
  } catch (error) {
    console.error("Error in replyToComment:", error);

    next(error);
  }
};
