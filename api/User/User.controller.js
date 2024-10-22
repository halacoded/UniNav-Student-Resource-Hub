const User = require("../../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();
const hashPassword = async (password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.log({ error: error });
  }
};

const generateToken = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return token;
};

//AUTH SECTION ****************************************************************************
exports.signup = async (req, res, next) => {
  try {
    const { username, email, password, confirmPassword, major } = req.body;
    console.log("Received data:", req.body); // Log the received data

    // Check if all required fields are provided
    if (!username || !email || !password || !confirmPassword || !major) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username or email already exists" });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);
    if (!hashedPassword) {
      return res.status(500).json({ message: "Error hashing password" });
    }

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      major,
      profileImage: "", // Default profile image
      backgroundImage: "",
    });

    await user.save();

    // Generate token for the new user
    const token = generateToken(user);

    res.status(201).json({ message: "User created successfully", token });
  } catch (err) {
    console.error("Signup error:", err);
    res
      .status(500)
      .json({ message: "Error creating user", error: err.message });
  }
};

exports.signin = async (req, res, next) => {
  try {
    const token = generateToken(req.user);
    return res.status(201).json({ token: token });
  } catch (err) {
    next(err);
  }
};
//USER SECTION ************************************************
// .populate("courses")
// .populate("reviews")
// .populate("followers", "username email profileImage")
// .populate("following", "username email profileImage");
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("followers", "username email profileImage backgroundImage")
      .populate("following", "username email profileImage backgroundImage")
      .populate({
        path: "courses",
        populate: {
          path: "professor",
          select: "name profileImage",
        },
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { username } = req.query;
    let query = {};

    if (username) {
      query.username = { $regex: username, $options: "i" }; // Case-insensitive search
    }

    const users = await User.find(query)
      .select("username email profileImage backgroundImage")
      .limit(10); // Limit the number of results

    res.status(200).json(users);
  } catch (error) {
    console.error("Search users error:", error);
    res
      .status(500)
      .json({ message: "Error searching users", error: error.message });
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    console.log("Received file:", req.file);
    console.log("Received body:", req.body);

    const userId = req.user._id; // Get the user ID from the authenticated user

    const { username, email, major } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle profile image upload
    if (req.file && req.file.fieldname === "profileImage") {
      user.profileImage = req.file.path;
    }

    // Handle background image upload
    if (req.file && req.file.fieldname === "backgroundImage") {
      user.backgroundImage = req.file.path;
    }

    // Handle username update
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      user.username = username;
    }

    // Handle email update
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      user.email = email;
    }

    // Update other fields
    if (major) user.major = major;

    await user.save();

    const updatedUser = await User.findById(userId)
      .select("-password")
      .populate("courses")
      .populate("reviews")
      .populate("followers", "username email profileImage backgroundImage")
      .populate("following", "username email profileImage backgroundImage");

    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error("Update user error:", err);
    res
      .status(500)
      .json({ message: "Error updating user", error: err.message });
  }
};

//Follow Section *************************************************************************
exports.followUser = async (req, res, next) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (currentUser.following.includes(userToFollow._id)) {
      return res
        .status(400)
        .json({ message: "You are already following this user" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $push: { following: userToFollow._id },
    });
    await User.findByIdAndUpdate(req.params.id, {
      $push: { followers: currentUser._id },
    });

    res.status(200).json({ message: "User followed successfully" });
  } catch (error) {
    console.error("Follow user error:", error);
    res
      .status(500)
      .json({ message: "Error following user", error: error.message });
  }
};

exports.unfollowUser = async (req, res, next) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!currentUser.following.includes(userToUnfollow._id)) {
      return res
        .status(400)
        .json({ message: "You are not following this user" });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $pull: { following: userToUnfollow._id },
    });
    await User.findByIdAndUpdate(req.params.id, {
      $pull: { followers: currentUser._id },
    });

    res.status(200).json({ message: "User unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow user error:", error);
    res
      .status(500)
      .json({ message: "Error unfollowing user", error: error.message });
  }
};

exports.getFollowers = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "followers",
      "username email"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.followers);
  } catch (error) {
    console.error("Get followers error:", error);
    res
      .status(500)
      .json({ message: "Error getting followers", error: error.message });
  }
};

exports.getFollowing = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate(
      "following",
      "username email"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user.following);
  } catch (error) {
    console.error("Get following error:", error);
    res
      .status(500)
      .json({ message: "Error getting following", error: error.message });
  }
};
