const mongoose = require("mongoose");
const { Schema } = mongoose;

const majorSchema = new Schema({
  name: { type: String, required: true, unique: true },
  users: [{ type: Schema.Types.ObjectId, ref: "User" }],
  courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
  communities: [{ type: Schema.Types.ObjectId, ref: "Community" }],
  resources: [{ type: Schema.Types.ObjectId, ref: "Resource" }],
  professors: [{ type: Schema.Types.ObjectId, ref: "Professor" }],

});

module.exports = mongoose.model("Major", majorSchema);

