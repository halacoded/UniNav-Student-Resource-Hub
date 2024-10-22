const mongoose = require("mongoose");
const { Schema, model } = mongoose;
const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    major: { type: String, required: true },
    // favorites: [{ type: Schema.Types.ObjectId, ref: "Recipe" }],
    profileImage: { type: String, default: "" },
    backgroundImage: { type: String, default: "" },
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],
    courses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    resources: [{ type: Schema.Types.ObjectId, ref: "Resource" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
