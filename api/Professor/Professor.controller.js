const Professor = require("../../models/Professor");
const User = require("../../models/User");
const Review = require("../../models/Review");
const Course = require("../../models/Course");

exports.createProfessor = async (req, res) => {
  try {
    const { name, courses, reviews } = req.body;
    const profileImage = req.file ? req.file.path : "";

    const newProfessor = new Professor({
      name,
      profileImage,
      courses,
      reviews,
    });

    await newProfessor.save();

    await Course.updateMany(
      { _id: { $in: courses } },
      { $push: { professor: newProfessor._id } }
    );

    await Review.updateMany(
      { _id: { $in: reviews } },
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
      .populate("reviews");
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
    const professor = await Professor.findById(req.params.id)
      .populate("courses")
      .populate("reviews");
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
    const { name, courses, reviews } = req.body;
    const profileImage = req.file ? req.file.path : "";

    const professor = await Professor.findById(req.params.id);
    if (!professor) {
      return res.status(404).json({ message: "Professor not found" });
    }

    professor.name = name || professor.name;
    professor.profileImage = profileImage || professor.profileImage;
    professor.courses = courses || professor.courses;
    professor.reviews = reviews || professor.reviews;

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

    await Review.updateMany({ professor: id }, { $pull: { professor: id } });

    res.status(200).json({ message: "Professor deleted successfully" });
  } catch (err) {
    console.error("Delete professor error:", err);
    res
      .status(500)
      .json({ message: "Error deleting professor", error: err.message });
  }
};
