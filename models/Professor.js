const mongoose = require("mongoose");
const { Schema } = mongoose;

const professorSchema = new Schema({
  name: { type: String, required: true, unique: true },
  profileImage: { type: String, default: "" },
  courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
});

module.exports = mongoose.model("Professor", professorSchema);
