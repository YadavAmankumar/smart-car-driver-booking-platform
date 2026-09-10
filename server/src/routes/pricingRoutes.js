const express = require("express");

const authMiddleware = require("../middleware/auth/authMiddleware");
const authorizeRoles = require("../middleware/auth/authorizeRoles");

const {
  getPricing,
  updatePricing,
  estimateFare,
} = require("../controllers/pricingController");

const router = express.Router();

router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  getPricing
);

router.put(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  updatePricing
);

router.post("/estimate", authMiddleware, authorizeRoles("customer"), estimateFare);

module.exports = router;

