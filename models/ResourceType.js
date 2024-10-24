const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const ResourceTypeSchema = new Schema({
  name: { type: String, required: true },
  resources: [{ type: Schema.Types.ObjectId, ref: "Resource" }],
});

module.exports = model("ResourceType", ResourceTypeSchema);
