const express = require("express");
const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  addRating,
} = require("./Courses.controller");
const passport = require("passport");
const upload = require("../../middleware/multer");

const authenticate = passport.authenticate("jwt", { session: false });
const courseRouter = express.Router();

courseRouter.post("/", createCourse);
courseRouter.get("/", getCourses);
courseRouter.get("/:id", getCourseById);
courseRouter.put("/:id", updateCourse);
courseRouter.delete("/:id", deleteCourse);
courseRouter.post("/:courseId/rate", authenticate, addRating);
module.exports = courseRouter;
