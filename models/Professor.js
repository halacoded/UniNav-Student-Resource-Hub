const mongoose = require("mongoose");
const { Schema } = mongoose;

const professorSchema = new Schema({
  name: { type: String, required: true, unique: true },
  profileImage: { type: String, default: "" },
  courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],

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

module.exports = mongoose.model("Professor", professorSchema);
