const express = require("express");
const {
  createProfessor,
  getProfessors,
  getProfessorById,
  updateProfessor,
  deleteProfessor,
} = require("./Professor.controller");
const upload = require("../../middleware/multer");

const professorRouter = express.Router();

professorRouter.post("/", upload.single("profileImage"), createProfessor);
professorRouter.get("/", getProfessors);
professorRouter.get("/:id", getProfessorById);
professorRouter.put("/:id", upload.single("profileImage"), updateProfessor);
professorRouter.delete("/:id", deleteProfessor);

module.exports = professorRouter;
