const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const resourceSchema = new Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  type: {
    type: String,
    enum: [
      "classNote",
      "homeWork",
      "book",
      "quize",
      "bankQuestions",
      "pastExame",
    ],
    required: true,
  },
  course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  dislikes: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

const Resource = model("Resource", resourceSchema);
module.exports = Resource;
