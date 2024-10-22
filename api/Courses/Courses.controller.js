const Professor = require("../../models/Professor");
const User = require("../../models/User");
const Review = require("../../models/Review");
const Course = require("../../models/Course");

exports.createCourse = async (req, res) => {
  try {
    const { name, users, reviews, professor } = req.body;

    const newCourse = new Course({
      name,
      users,
      reviews,
      professor,
    });

    await newCourse.save();

    await User.updateMany(
      { _id: { $in: users } },
      { $push: { courses: newCourse._id } }
    );

    await Review.updateMany(
      { _id: { $in: reviews } },
      { $push: { course: newCourse._id } }
    );

    await Professor.findByIdAndUpdate(
      professor,
      { $push: { courses: newCourse._id } },
      { new: true }
    );

    res
      .status(201)
      .json({ message: "Course created successfully", course: newCourse });
  } catch (err) {
    console.error("Create course error:", err);
    res
      .status(500)
      .json({ message: "Error creating course", error: err.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("users")
      .populate("reviews")
      .populate("professor");
    res.status(200).json(courses);
  } catch (err) {
    console.error("Get courses error:", err);
    res
      .status(500)
      .json({ message: "Error fetching courses", error: err.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("users")
      .populate("reviews")
      .populate("professor");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json(course);
  } catch (err) {
    console.error("Get course by ID error:", err);
    res
      .status(500)
      .json({ message: "Error fetching course", error: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { name, users, reviews, professor } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.name = name || course.name;
    course.users = users || course.users;
    course.reviews = reviews || course.reviews;
    course.professor = professor || course.professor;

    await course.save();
    res.status(200).json({ message: "Course updated successfully", course });
  } catch (err) {
    console.error("Update course error:", err);
    res
      .status(500)
      .json({ message: "Error updating course", error: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    await course.remove();
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error("Delete course error:", err);
    res
      .status(500)
      .json({ message: "Error deleting course", error: err.message });
  }
};
