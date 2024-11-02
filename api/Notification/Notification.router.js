const express = require("express");
const notificationRoutes = express.Router();
const { getNotifications, markAsRead } = require("./Notification.controller");
const passport = require("passport");

const authenticate = passport.authenticate("jwt", { session: false });

notificationRoutes.get("/", authenticate, getNotifications);
notificationRoutes.put("/:notificationId/read", authenticate, markAsRead);

module.exports = notificationRoutes;
