const express = require("express");
const {
  createProfessor,
  getProfessors,
  getProfessorById,
  updateProfessor,
  deleteProfessor,
  addProfessorRating,
} = require("./Professor.controller");
const upload = require("../../middleware/multer");
const passport = require("passport");
const authenticate = passport.authenticate("jwt", { session: false });
const professorRouter = express.Router();

professorRouter.post("/", upload.single("profileImage"), createProfessor);
professorRouter.get("/", getProfessors);
professorRouter.get("/:id", getProfessorById);
professorRouter.put("/:id", upload.single("profileImage"), updateProfessor);
professorRouter.delete("/:id", deleteProfessor);
professorRouter.post("/:professorId/rate", authenticate, addProfessorRating);
module.exports = professorRouter;
