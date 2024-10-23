const mongoose = require("mongoose");
const { Schema } = mongoose;

const courseSchema = new Schema({
  name: { type: String, required: true, unique: true },
  level: { type: String, required: true },
  about: { type: String, required: true },
  users: [{ type: Schema.Types.ObjectId, ref: "User" }],
  professor: { type: Schema.Types.ObjectId, ref: "Professor" },
  resources: [{ type: Schema.Types.ObjectId, ref: "Resource" }],
  commuinties: [{ type: Schema.Types.ObjectId, ref: "Community" }],
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
  avgRating: { type: Number, default: 0 },
  major: { type: Schema.Types.ObjectId, ref: "Major" },
});

module.exports = mongoose.model("Course", courseSchema);
