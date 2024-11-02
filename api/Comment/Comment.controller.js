const Comment = require("../../models/Comment");
const Course = require("../../models/Course");
const Professor = require("../../models/Professor");
const Community = require("../../models/Community");
const Chat = require("../../models/Chat");
const { notifyNewMessage } = require("../Notification/Notification.controller");
// Get all comments for a specific course, professor, community, or chat
exports.getComments = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const filter = { parentComment: null };

    if (type === "course") {
      filter.course = id;
    } else if (type === "professor") {
      filter.professor = id;
    } else if (type === "community") {
      filter.community = id;
    } else if (type === "chat") {
      filter.chat = id;
    } else {
      return res.status(400).json({ message: "Invalid type" });
    }

    const comments = await Comment.find(filter)
      .sort("-createdAt")
      .populate("user", "username profileImage")
      .populate({
        path: "replies",
        populate: { path: "user", select: "username profileImage" },
      });

    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

// Create a new comment
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
    } else if (type === "community") {
      const community = await Community.findById(id);
      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }
      newComment = new Comment({
        user: userId,
        community: id,
        content,
        commentType: "community",
      });
      await Community.findByIdAndUpdate(id, {
        $push: { comments: newComment._id },
      });
    } else if (type === "chat") {
      const chat = await Chat.findById(id);
      if (!chat) {
        return res.status(404).json({ message: "Chat not found" });
      }
      newComment = new Comment({
        user: userId,
        chat: id,
        content,
        commentType: "chat",
      });
      await Chat.findByIdAndUpdate(id, {
        $push: { comments: newComment._id },
      });

      // Notify users about the new message
      await notifyNewMessage(id, userId);
    } else {
      return res.status(400).json({ message: "Invalid type" });
    }

    await newComment.save();
    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ message: "Internal server error", error });
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

    // Update the course, professor, community, or chat's comments array
    if (comment.commentType === "course") {
      await Course.findByIdAndUpdate(comment.course, {
        $pull: { comments: commentId },
      });
    } else if (comment.commentType === "professor") {
      await Professor.findByIdAndUpdate(comment.professor, {
        $pull: { comments: commentId },
      });
    } else if (comment.commentType === "community") {
      await Community.findByIdAndUpdate(comment.community, {
        $pull: { comments: commentId },
      });
    } else if (comment.commentType === "chat") {
      await Chat.findByIdAndUpdate(comment.chat, {
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
      content,
      parentComment: commentId,
      commentType: parentComment.commentType,
      course: parentComment.course,
      professor: parentComment.professor,
      community: parentComment.community,
      chat: parentComment.chat,
    });

    // Save the new reply
    await newReply.save();

    // Add the reply to the parent comment's replies array
    await Comment.findByIdAndUpdate(commentId, {
      $push: { replies: newReply._id },
    });

    // Update the course, professor, community, or chat's comments array
    if (parentComment.commentType === "course") {
      await Course.findByIdAndUpdate(parentComment.course, {
        $push: { comments: newReply._id },
      });
    } else if (parentComment.commentType === "professor") {
      await Professor.findByIdAndUpdate(parentComment.professor, {
        $push: { comments: newReply._id },
      });
    } else if (parentComment.commentType === "community") {
      await Community.findByIdAndUpdate(parentComment.community, {
        $push: { comments: newReply._id },
      });
    } else if (parentComment.commentType === "chat") {
      await Chat.findByIdAndUpdate(parentComment.chat, {
        $push: { comments: newReply._id },
      });
    }

    // Populate user information for the response
    await newReply.populate("user", "username profileImage");

    res.status(201).json(newReply);
  } catch (error) {
    next(error);
  }
};
