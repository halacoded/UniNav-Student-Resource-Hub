const { Schema, model } = require("mongoose");

const commentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    professor: { type: Schema.Types.ObjectId, ref: "Professor" },
    community: { type: Schema.Types.ObjectId, ref: "Community" },
    chat: { type: Schema.Types.ObjectId, ref: "Chat" },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    replies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    commentType: {
      type: String,
      enum: ["course", "professor", "community", "chat"],
      required: true,
    },
  },
  { timestamps: true }
);

// Index for efficient querying of comments by course/professor/community and creation date
commentSchema.index({ course: 1, createdAt: -1 });
commentSchema.index({ professor: 1, createdAt: -1 });
commentSchema.index({ community: 1, createdAt: -1 });

const Comment = model("Comment", commentSchema);

module.exports = Comment;
