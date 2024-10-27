const Chat = require("../../models/Chat");
const Comment = require("../../models/Comment");
const User = require("../../models/User");
// Create a new chat
exports.createChat = async (req, res) => {
  try {
    // Create a new chat
    const newChat = new Chat({
      chatName: req.body.chatName,
      participants: req.body.participants,
      comments: [],
    });
    const savedChat = await newChat.save();

    // Update each participant's user document
    const participantIds = req.body.participants;
    await User.updateMany(
      { _id: { $in: participantIds } },
      { $push: { Chats: savedChat._id } }
    );

    res.status(201).json(savedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Get all chats
exports.getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find()
      .populate({
        path: "participants",
        select: "username profileImage",
      })
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username profileImage",
        },
        select: "content createdAt",
      });
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific chat by ID
exports.getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id)
      .populate({
        path: "participants",
        select: "username profileImage",
      })
      .populate({
        path: "comments",
        populate: { path: "user", select: "username profileImage" },
      });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a comment to a chat
exports.addCommentToChat = async (req, res) => {
  try {
    const newComment = new Comment({
      user: req.user._id,
      content: req.body.content,
      commentType: "chat",
      chat: req.params.id,
    });
    const savedComment = await newComment.save();

    const updatedChat = await Chat.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: savedComment._id } },
      { new: true }
    )
      .populate("participants")
      .populate({
        path: "comments",
        populate: { path: "user", select: "username profileImage" },
      });

    res.status(201).json(updatedChat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
