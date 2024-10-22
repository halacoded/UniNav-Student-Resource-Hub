const Professor = require("../../models/Professor");
const User = require("../../models/User");

const Course = require("../../models/Course");
const Comment = require("../../models/Comment");
exports.createProfessor = async (req, res) => {
  try {
    const { name, courses } = req.body;
    const profileImage = req.file ? req.file.path : "";

    const newProfessor = new Professor({
      name,
      profileImage,
      courses,
    });

    await newProfessor.save();

    await Course.updateMany(
      { _id: { $in: courses } },
      { $push: { professor: newProfessor._id } }
    );

    res.status(201).json({
      message: "Professor created successfully",
      professor: newProfessor,
    });
  } catch (err) {
    console.error("Create professor error:", err);
    res
      .status(500)
      .json({ message: "Error creating professor", error: err.message });
  }
};

exports.getProfessors = async (req, res) => {
  try {
    const professors = await Professor.find()
      .populate("courses")

      .populate("comments");
    res.status(200).json(professors);
  } catch (err) {
    console.error("Get professors error:", err);
    res
      .status(500)
      .json({ message: "Error fetching professors", error: err.message });
  }
};

exports.getProfessorById = async (req, res) => {
  try {
    const professor = await Professor.findById(req.params.id).populate(
      "courses"
    );

    if (!professor) {
      return res.status(404).json({ message: "Professor not found" });
    }
    res.status(200).json(professor);
  } catch (err) {
    console.error("Get professor by ID error:", err);
    res
      .status(500)
      .json({ message: "Error fetching professor", error: err.message });
  }
};

exports.updateProfessor = async (req, res) => {
  try {
    const { name, courses } = req.body;
    const profileImage = req.file ? req.file.path : "";

    const professor = await Professor.findById(req.params.id);
    if (!professor) {
      return res.status(404).json({ message: "Professor not found" });
    }

    professor.name = name || professor.name;
    professor.profileImage = profileImage || professor.profileImage;
    professor.courses = courses || professor.courses;

    await professor.save();
    res
      .status(200)
      .json({ message: "Professor updated successfully", professor });
  } catch (err) {
    console.error("Update professor error:", err);
    res
      .status(500)
      .json({ message: "Error updating professor", error: err.message });
  }
};
exports.deleteProfessor = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProfessor = await Professor.findByIdAndDelete(id);

    if (!deletedProfessor) {
      return res.status(404).json({ message: "Professor not found" });
    }

    await Course.updateMany({ professors: id }, { $pull: { professors: id } });

    res.status(200).json({ message: "Professor deleted successfully" });
  } catch (err) {
    console.error("Delete professor error:", err);
    res
      .status(500)
      .json({ message: "Error deleting professor", error: err.message });
  }
};

//rating
exports.addProfessorRating = async (req, res, next) => {
  try {
    const { professorId } = req.params;
    const { rating } = req.body;
    const userId = req.user._id;

    const professor = await Professor.findById(professorId);
    if (!professor) {
      return res.status(404).json({ message: "Professor not found" });
    }

    // Check if the user has already rated the professor
    const existingRating = professor.ratings.find(
      (r) => r.user.toString() === userId.toString()
    );
    if (existingRating) {
      existingRating.rating = rating; // Update the existing rating
    } else {
      professor.ratings.push({ user: userId, rating }); // Add a new rating
    }

    await professor.save();

    // Calculate the average rating
    const sum = professor.ratings.reduce(
      (acc, rating) => acc + rating.rating,
      0
    );
    const averageRating = (sum / professor.ratings.length).toFixed(1);

    res.status(200).json({ averageRating });
  } catch (error) {
    next(error);
  }
};
