const Major = require("../../models/Major");

const createMajor = async (req, res, next) => {
  try {
    const { name } = req.body;
    const major = new Major({ name });
    await major.save();
    res.status(201).json(major);
  } catch (err) {
    next(err);
  }
};
const getMajors = async (req, res, next) => {
  try {
    const majors = await Major.find();
    res.status(200).json(majors);
  } catch (err) {
    next(err);
  }
};
const getMajor = async (req, res, next) => {
  try {
    const { id } = req.params;
  const major = await Major.findById(id);
    res.status(200).json(major);
  } catch (err) {
    next(err);
  }
};
const updateMajor = async (req, res, next) => {
  try {
    const { id } = req.params;
  const { name, users, courses, communities, resources, professors } = req.body;
  const major = await Major.findByIdAndUpdate(id, { name, users, courses, communities, resources, professors }, { new: true });
    res.status(200).json(major);
  } catch (err) {
    next(err);
  }
};
const deleteMajor = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Major.findByIdAndDelete(id);
    res.status(200).json({ message: "Major deleted" });
  } catch (err) {
    next(err);
  }
};
module.exports = { createMajor, getMajors, getMajor, updateMajor, deleteMajor };
