const asyncHandler = require("../utils/asyncHandler");
const { searchLocations, getRoute } = require("../services/locationService");

exports.searchLocations = asyncHandler(async (req, res) => {
  const query = String(req.query.q || "").trim();
  if (query.length < 3) return res.status(400).json({ success: false, message: "Enter at least 3 characters." });
  res.json({ success: true, data: await searchLocations(query) });
});

exports.getDistance = asyncHandler(async (req, res) => {
  const { pickup, drop } = req.body || {};
  if (![pickup, drop].every((point) => Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude))) {
    return res.status(400).json({ success: false, message: "Valid pickup and drop coordinates are required." });
  }
  res.json({ success: true, data: await getRoute({ pickup, drop }) });
});
