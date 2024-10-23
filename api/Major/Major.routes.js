const express = require("express");
const router = express.Router();
const { createMajor, getMajors, getMajor, updateMajor, deleteMajor } = require("./Major.controller");

router.post("/", createMajor);
router.get("/", getMajors);
router.get("/:id", getMajor);
router.put("/:id", updateMajor);
router.delete("/:id", deleteMajor);

module.exports = router;