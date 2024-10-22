const Professor = require("../../models/Professor");
const User = require("../../models/User");

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
      .populate("professor")
      .populate("comments");
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
    const { name, users, professor } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    course.name = name || course.name;
    course.users = users || course.users;

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

//Rating retrun avg directly every time there is new rating

exports.addRating = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { rating } = req.body;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if the user has already rated the course
    const existingRating = course.ratings.find(
      (r) => r.user.toString() === userId.toString()
    );
    if (existingRating) {
      existingRating.rating = rating; // Update the existing rating
    } else {
      course.ratings.push({ user: userId, rating }); // Add a new rating
    }

    await course.save();

    // Calculate the average rating
    const sum = course.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    const averageRating = (sum / course.ratings.length).toFixed(1);

    res.status(200).json({ averageRating });
  } catch (error) {
    next(error);
  }
};
