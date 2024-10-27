const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const resourceSchema = new Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  resourceType: {
    type: Schema.Types.ObjectId,
    ref: "ResourceType",
  },
  community: { type: Schema.Types.ObjectId, ref: "Community" },
  course: { type: Schema.Types.ObjectId, ref: "Course" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  dislikes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  major: { type: Schema.Types.ObjectId, ref: "Major" },
});

const Resource = model("Resource", resourceSchema);
module.exports = Resource;
