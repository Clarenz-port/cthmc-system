const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");

// Public
router.post("/register", register);
router.post("/login", login);

// Role-based examples
router.get("/member", verifyToken, allowRoles("member", "admin", "superadmin"), (req, res) => {
  res.json({ message: "Welcome Member" });
});

router.get("/admin", verifyToken, allowRoles("admin", "superadmin"), (req, res) => {
  res.json({ message: "Welcome Admin" });
});

router.get("/superadmin", verifyToken, allowRoles("superadmin"), (req, res) => {
  res.json({ message: "Welcome Super Admin" });
});

module.exports = router;
