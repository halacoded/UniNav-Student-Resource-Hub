const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true }, // e.g., "new_resource", "new_message"
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    relatedResource: { type: Schema.Types.ObjectId, ref: "Resource" },
    relatedChat: { type: Schema.Types.ObjectId, ref: "Chat" },
  },
  { timestamps: true }
);

const Notification = model("Notification", notificationSchema);

module.exports = Notification;
