const { Schema, model } = require("mongoose");
const chatSchema = new Schema(
  {
    chatName: {
      type: String,
      required: true,
      trim: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    comments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
  },
  { timestamps: true }
);

const Chat = model("Chat", chatSchema);

module.exports = Chat;
