const ResourceType = require("../../models/ResourceType");

exports.createResourceType = async (req, res) => {
  const { name } = req.body;
  const resourceType = await ResourceType.create({ name });
  res.status(201).json(resourceType);
};

exports.getResourceTypes = async (req, res) => {
  const resourceTypes = await ResourceType.find();
  res.status(200).json(resourceTypes);
};
