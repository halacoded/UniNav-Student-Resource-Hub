const express = require("express");
const MajorRouter = express.Router();

const { createMajor, getMajors, getMajor, updateMajor, deleteMajor } = require("./Major.controller");

MajorRouter.post("/", createMajor);
MajorRouter.get("/", getMajors);
MajorRouter.get("/:id", getMajor);
MajorRouter.put("/:id", updateMajor);
MajorRouter.delete("/:id", deleteMajor);

module.exports = MajorRouter;