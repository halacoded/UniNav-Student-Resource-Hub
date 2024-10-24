const express = require("express");
const ResourceTypeRouter = express.Router();
const { createResourceType, getResourceTypes } = require("./ResourceType.controller");

ResourceTypeRouter.post("/", createResourceType);
ResourceTypeRouter.get("/", getResourceTypes);

module.exports = ResourceTypeRouter;
