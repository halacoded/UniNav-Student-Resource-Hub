const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    professor: { type: Schema.Types.ObjectId, ref: "Professor" },
    course: { type: Schema.Types.ObjectId, ref: "Course" },
    stars: { type: Number, required: true },
    comments: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
