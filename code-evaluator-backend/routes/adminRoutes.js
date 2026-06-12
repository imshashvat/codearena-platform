const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { getPlatformStats, listUsers, changeUserRole, deleteUser } = require("../controllers/adminController");

// Admin middleware check
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

router.get("/stats", auth, adminOnly, getPlatformStats);
router.get("/users", auth, adminOnly, listUsers);
router.put("/users/:userId/role", auth, adminOnly, changeUserRole);
router.delete("/users/:userId", auth, adminOnly, deleteUser);

module.exports = router;
