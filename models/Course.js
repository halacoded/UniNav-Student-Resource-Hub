const mongoose = require("mongoose");
const { Schema } = mongoose;

const courseSchema = new Schema({
  name: { type: String, required: true, unique: true },
  users: [{ type: Schema.Types.ObjectId, ref: "User" }],
  reviews: [{ type: Schema.Types.ObjectId, ref: "Review" }],
  professors: [{ type: Schema.Types.ObjectId, ref: "Professor" }],
});

module.exports = mongoose.model("Course", courseSchema);
