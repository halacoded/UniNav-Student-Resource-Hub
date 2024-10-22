const mongoose = require("mongoose");
const { Schema } = mongoose;

const courseSchema = new Schema({
  name: { type: String, required: true, unique: true },
  users: [{ type: Schema.Types.ObjectId, ref: "User" }],
  professor: { type: Schema.Types.ObjectId, ref: "Professor" },
  resources: [{ type: Schema.Types.ObjectId, ref: "Resource" }],
  comments: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  ratings: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      rating: { type: Number, required: true, min: 1, max: 5 },
    },
  ],
});

module.exports = mongoose.model("Course", courseSchema);
