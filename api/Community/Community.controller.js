const Community = require("../../models/Community");
const Resource = require("../../models/Resource");
const Course = require("../../models/Course");
const User = require("../../models/User");

const getAllCommunities = async (req, res) => {
  try {
    const communities = await Community.find().populate(
      "createdBy resources course followers"
    );
    res.json(communities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCommunityById = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id).populate(
      "createdBy resources course followers"
    );
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }
    if (!community.public && !community.followers.includes(req.user._id)) {
      return res.status(403).json({ error: "Access denied" });
    }
    res.json(community);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
const createCommunity = async (req, res) => {
  const session = await Community.startSession();
  session.startTransaction();
  try {
    const profileImage = req.file ? req.file.path : "";

    const newCommunity = new Community({
      ...req.body,
      profileImage,
      createdBy: req.user._id,
    });
    const savedCommunity = await newCommunity.save({ session });

    await session.commitTransaction();
    session.endSession();

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { communities: savedCommunity._id } },
      { new: true }
    );

    console.log("Updated user communities:", updatedUser.communities); // Log updated communities

    res.status(201).json(savedCommunity);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: error.message });
  }
};

const updateCommunity = async (req, res) => {
  const session = await Community.startSession();
  session.startTransaction();
  try {
    const profileImage = req.file ? req.file.path : "";

    const updatedCommunity = await Community.findByIdAndUpdate(
      req.params.id,
      { ...req.body, profileImage },
      { new: true, session }
    );
    if (!updatedCommunity) {
      return res.status(404).json({ error: "Community not found" });
    }

    // Update related users, resources, and course
    await User.updateMany(
      { _id: { $in: req.body.users } },
      { $push: { communities: updatedCommunity._id } },
      { session }
    );
    await Resource.updateMany(
      { _id: { $in: req.body.resources } },
      { $push: { communities: updatedCommunity._id } },
      { session }
    );
    await Course.findByIdAndUpdate(
      req.body.course,
      { $push: { communities: updatedCommunity._id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.json(updatedCommunity);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: error.message });
  }
};

const deleteCommunity = async (req, res) => {
  const session = await Community.startSession();
  session.startTransaction();
  try {
    const deletedCommunity = await Community.findByIdAndDelete(req.params.id, {
      session,
    });
    if (!deletedCommunity) {
      return res.status(404).json({ error: "Community not found" });
    }

    // Update related users, resources, and course
    await User.updateMany(
      { communities: deletedCommunity._id },
      { $pull: { communities: deletedCommunity._id } },
      { session }
    );
    await Resource.updateMany(
      { communities: deletedCommunity._id },
      { $pull: { communities: deletedCommunity._id } },
      { session }
    );
    await Course.updateMany(
      { communities: deletedCommunity._id },
      { $pull: { communities: deletedCommunity._id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.json({ message: "Community deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: error.message });
  }
};
const requestToJoinCommunity = async (req, res) => {
  const session = await Community.startSession();
  session.startTransaction();
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }
    if (community.followers.includes(req.user._id)) {
      return res.status(400).json({ error: "Already a member" });
    }
    if (community.public) {
      community.followers.push(req.user._id);
      await community.save({ session });

      // Update the user's communities field
      await User.findByIdAndUpdate(
        req.user._id,
        { $push: { communities: community._id } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ message: "Joined community successfully" });
    } else {
      if (community.joinRequests.includes(req.user._id)) {
        return res.status(400).json({ error: "Already requested to join" });
      }
      community.joinRequests.push(req.user._id);
      await community.save({ session });

      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ message: "Join request sent" });
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: error.message });
  }
};
const approveJoinRequest = async (req, res) => {
  const session = await Community.startSession();
  session.startTransaction();
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }
    if (community.createdBy.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Only the creator can approve requests" });
    }
    const userId = req.params.userId;
    const requestIndex = community.joinRequests.indexOf(userId);
    if (requestIndex === -1) {
      return res.status(404).json({ error: "Join request not found" });
    }
    community.joinRequests.splice(requestIndex, 1);
    community.followers.push(userId);
    await community.save({ session });

    // Update the user's communities field
    await User.findByIdAndUpdate(
      userId,
      { $push: { communities: community._id } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({ message: "User added to community" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getAllCommunities,
  getCommunityById,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  requestToJoinCommunity,
  approveJoinRequest,
};
