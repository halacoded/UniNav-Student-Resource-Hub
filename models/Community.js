const mongoose = require("mongoose");
const { Schema } = mongoose;

const communitySchema = new Schema({
  name: { type: String, required: true, unique: true },
  resources: [{ type: Schema.Types.ObjectId, ref: "Resource" }],
  course: { type: Schema.Types.ObjectId, ref: "Course" },
  public: { type: Boolean, default: true },
  followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  joinRequests: [{ type: Schema.Types.ObjectId, ref: "User" }],
  profileImage: { type: String, default: "" },
  major: { type: Schema.Types.ObjectId, ref: "Major" },
  comments: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      text: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("Community", communitySchema);
