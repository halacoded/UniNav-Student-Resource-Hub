const Resource = require("../../models/Resource");
const Course = require("../../models/Course");
const User = require("../../models/User");
const Community = require("../../models/Community");
const ResourceType = require("../../models/ResourceType");
exports.createResource = async (req, res) => {
  try {
    console.log(req.body);
    const { title, type, course, community } = req.body;
    console.log(title, type, course, community);
    const userId = req.user._id;
    const url = req.file ? `/media/${req.file.filename}` : req.body.url;
    const resourceTypeFound = await ResourceType.findOne({
      name: type,
    });
    const communityFound = await Community.findOne({ name: community });
    const courseFound = await Course.findOne({ name: course });

    const newResource = new Resource({
      title,
      url,
      ResourceType: resourceTypeFound?._id,
      course: courseFound?._id,
      community: communityFound?._id,
      createdBy: userId,
    });

    console.log("new resource", newResource);
    await newResource.save();

    await Course.findByIdAndUpdate(
      courseFound?._id,
      { $push: { resources: newResource._id } },
      { new: true }
    );
    await Community.findByIdAndUpdate(
      communityFound?._id,
      { $push: { resources: newResource._id } },
      { new: true }
    );
    await User.findByIdAndUpdate(
      userId,
      { $push: { resources: newResource._id } },
      { new: true }
    );
    await ResourceType.findByIdAndUpdate(
      resourceTypeFound._id,
      { $push: { resources: newResource._id } },
      { new: true }
    );

    res.status(201).json({
      message: "Resource created successfully",
      resource: newResource,
    });
  } catch (err) {
    console.error("Create resource error:", err);
    res
      .status(500)
      .json({ message: "Error creating resource", error: err.message });
  }
};

exports.getResources = async (req, res) => {
  try {
    const resources = await Resource.find()
      .populate("course")
      .populate("community")
      .populate("likes", "username email")
      .populate("dislikes", "username email");
    res.status(200).json(resources);
  } catch (err) {
    console.error("Get resources error:", err);
    res
      .status(500)
      .json({ message: "Error fetching resources", error: err.message });
  }
};
exports.getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate("course")
      .populate("community")
      .populate("likes", "username email")
      .populate("dislikes", "username email");
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }
    res.status(200).json(resource);
  } catch (err) {
    console.error("Get resource by ID error:", err);
    res
      .status(500)
      .json({ message: "Error fetching resource", error: err.message });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const userId = req.user._id;
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // Ensure the user deleting the resource is the one who created it
    if (resource.createdBy.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this resource" });
    }

    // Remove the resource from the Course schema
    await Course.findByIdAndUpdate(
      resource.course,
      { $pull: { resources: resource._id } },
      { new: true }
    );
    await Community.findByIdAndUpdate(
      resource.community,
      { $pull: { resources: resource._id } },
      { new: true }
    );
    // Remove the resource from the User schema
    await User.findByIdAndUpdate(
      userId,
      { $pull: { resources: resource._id } },
      { new: true }
    );

    res.status(200).json({ message: "Resource deleted successfully" });
  } catch (err) {
    console.error("Delete resource error:", err);
    res
      .status(500)
      .json({ message: "Error deleting resource", error: err.message });
  }
};

//like and dislike
exports.toggleLikeResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const userLikedIndex = resource.likes.indexOf(userId);
    const userDislikedIndex = resource.dislikes.indexOf(userId);

    if (userLikedIndex > -1) {
      // User already liked, so unlike
      resource.likes.splice(userLikedIndex, 1);
    } else {
      // Add like and remove dislike if exists
      resource.likes.push(userId);
      if (userDislikedIndex > -1) {
        resource.dislikes.splice(userDislikedIndex, 1);
      }
    }

    await resource.save();

    res.status(200).json({
      likes: resource.likes.length,
      dislikes: resource.dislikes.length,
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleDislikeResource = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    const userLikedIndex = resource.likes.indexOf(userId);
    const userDislikedIndex = resource.dislikes.indexOf(userId);

    if (userDislikedIndex > -1) {
      // User already disliked, so remove dislike
      resource.dislikes.splice(userDislikedIndex, 1);
    } else {
      // Add dislike and remove like if exists
      resource.dislikes.push(userId);
      if (userLikedIndex > -1) {
        resource.likes.splice(userLikedIndex, 1);
      }
    }

    await resource.save();

    res.status(200).json({
      likes: resource.likes.length,
      dislikes: resource.dislikes.length,
    });
  } catch (error) {
    next(error);
  }
};
