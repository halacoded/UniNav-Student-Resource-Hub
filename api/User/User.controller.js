const User = require("../../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Major = require("../../models/Major");

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

    const majorFound = await Major.findOne({ name: major });

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword,
      major: majorFound._id,
      profileImage: "", // Default profile image
      backgroundImage: "",
    });

    await user.save();
    await Major.findByIdAndUpdate(
      majorFound._id,
      { $push: { users: user._id } },
      { new: true }
    );
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

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("followers", "username email profileImage backgroundImage")
      .populate("following", "username email profileImage backgroundImage")
      .populate("communities")
      .populate("resources")
      .populate("bookmarks")
      .populate("awards")
      .populate({
        path: "Chats",
        populate: [
          {
            path: "comments",
            populate: {
              path: "user",
              select: "username profileImage",
            },
            select: "content createdAt",
          },
          {
            path: "participants",
            select: "username profileImage", // Add this line to populate participants with profileImage
          },
        ],
      })
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
    console.log("User data fetched successfully:", user._id); // Log user data fetched
    await checkAndAddAward(user);
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

    const users = await User.find(query).select(
      "username email profileImage backgroundImage"
    );

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
    console.log("Received files:", req.files);
    console.log("Received body:", req.body);

    const userId = req.user._id; // Get the user ID from the authenticated user

    const { username, email, major } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Handle profile image upload
    if (req.files && req.files.profileImage) {
      user.profileImage = req.files.profileImage[0].path;
    }

    // Handle background image upload
    if (req.files && req.files.backgroundImage) {
      user.backgroundImage = req.files.backgroundImage[0].path;
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
      .populate("awards")
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

//bookmark*************************

exports.addBookmark = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.bookmarks.includes(req.params.resourceId)) {
      user.bookmarks.push(req.params.resourceId);
      await user.save();
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.removeBookmark = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.bookmarks = user.bookmarks.filter(
      (resourceId) => resourceId.toString() !== req.params.resourceId
    );
    await user.save();

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

//award logic
const checkAndAddAward = async (user) => {
  try {
    console.log("Checking awards for user:", user._id); // Log user ID

    if (
      user.following &&
      user.following.length === 1 &&
      !user.awards.includes("First Follow")
    ) {
      console.log("Adding 'First Follow' award");
      user.awards.push("First Follow");
    }
    if (
      user.resources &&
      user.resources.length === 1 &&
      !user.awards.includes("First Upload")
    ) {
      console.log("Adding 'First Upload' award");
      user.awards.push("First Upload");
    }
    if (
      user.communities &&
      user.communities.length === 1 &&
      !user.awards.includes("First Community Join")
    ) {
      console.log("Adding 'First Community Join' award");
      user.awards.push("First Community Join");
    }
    if (
      user.comments &&
      user.comments.length === 1 &&
      !user.awards.includes("First Comment")
    ) {
      console.log("Adding 'First Comment' award");
      user.awards.push("First Comment");
    }
    if (
      user.profileImage &&
      user.profileImage !== "" &&
      !user.awards.includes("First Profile Image")
    ) {
      console.log("Adding 'First Profile Image' award");
      user.awards.push("First Profile Image");
    }

    console.log("Awards before saving:", user.awards); // Log awards before saving
    await user.save();
    console.log("User saved successfully"); // Log after saving
  } catch (error) {
    console.error("Error in checkAndAddAward function:", error); // Log the error details
    throw error; // Rethrow the error to be caught by the calling function
  }
};
exports.getUserById = async (req, res, next) => {
  try {
    console.log("Fetching user with ID:", req.params.userID); // Log the user ID
    const user = await User.findById(req.params.userID)
      .populate("followers", "username email profileImage backgroundImage")
      .populate("following", "username email profileImage backgroundImage")
      .populate("communities")
      .populate("resources")
      .populate("bookmarks")
      .populate("awards")
      .populate({
        path: "Chats",
        populate: [
          {
            path: "comments",
            populate: {
              path: "user",
              select: "username profileImage",
            },
            select: "content createdAt",
          },
          {
            path: "participants",
            select: "username profileImage",
          },
        ],
      })
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
// Follow/Unfollow Section *************************************************************************
exports.toggleFollowUser = async (req, res, next) => {
  try {
    const userToToggle = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToToggle || !currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFollowing = currentUser.following.includes(userToToggle._id);

    if (isFollowing) {
      // Unfollow the user
      await User.findByIdAndUpdate(req.user.id, {
        $pull: { following: userToToggle._id },
      });
      await User.findByIdAndUpdate(req.params.id, {
        $pull: { followers: currentUser._id },
      });
      return res.status(200).json({ message: "User unfollowed successfully" });
    } else {
      // Follow the user
      await User.findByIdAndUpdate(req.user.id, {
        $push: { following: userToToggle._id },
      });
      await User.findByIdAndUpdate(req.params.id, {
        $push: { followers: currentUser._id },
      });
      return res.status(200).json({ message: "User followed successfully" });
    }
  } catch (error) {
    console.error("Toggle follow user error:", error);
    res
      .status(500)
      .json({ message: "Error toggling follow status", error: error.message });
  }
};
