const Notification = require("../../models/Notification");
const User = require("../../models/User");
const Community = require("../../models/Community");
const Course = require("../../models/Course");
const Chat = require("../../models/Chat");
// Function to create a notification
const createNotification = async (
  userId,
  type,
  message,
  relatedResource = null,
  relatedChat = null
) => {
  const notification = new Notification({
    user: userId,
    type,
    message,
    relatedResource,
    relatedChat,
  });
  await notification.save();

  await User.findByIdAndUpdate(userId, {
    $push: { notifications: notification._id },
  });
};

const notifyNewResource = async (resourceId, communityId, courseId) => {
  let usersToNotify = new Set();
  let notificationMessage = "A new resource has been added.";

  if (communityId) {
    const community = await Community.findById(communityId).populate(
      "followers"
    );
    if (community) {
      community.followers.forEach((user) =>
        usersToNotify.add(user._id.toString())
      );
      notificationMessage = `A new resource has been added to the community: ${community.name}.`;
    }
  } else if (courseId) {
    const course = await Course.findById(courseId).populate("users");
    if (course) {
      course.users.forEach((user) => usersToNotify.add(user._id.toString()));
      notificationMessage = `A new resource has been added to the course: ${course.name}.`;
    }
  }

  for (const userId of usersToNotify) {
    await createNotification(
      userId,
      "new_resource",
      notificationMessage,
      resourceId
    );
  }
};

const notifyNewMessage = async (chatId, senderId) => {
  const chat = await Chat.findById(chatId).populate("participants");
  if (!chat) {
    throw new Error("Chat not found");
  }

  const notifications = chat.participants.map((participant) => {
    if (participant._id.toString() !== senderId.toString()) {
      return createNotification(
        participant._id,
        "new_message",
        `You have a new message in the chat: ${chat.name}.`,
        null,
        chatId
      );
    }
  });

  await Promise.all(notifications);
};

// Get notifications for the authenticated user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ user: userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark a notification as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createNotification,
  notifyNewResource,
  notifyNewMessage,
  getNotifications,
  markAsRead,
};
