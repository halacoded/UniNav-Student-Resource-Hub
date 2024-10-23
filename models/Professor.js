const mongoose = require("mongoose");
const { Schema } = mongoose;

const professorSchema = new Schema({
  name: { type: String, required: true, unique: true },
  about: { type: String, required: true },
  profileImage: { type: String, default: "" },
  courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
  major: { type: Schema.Types.ObjectId, ref: "Major" },
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
});

module.exports = mongoose.model("Professor", professorSchema);
