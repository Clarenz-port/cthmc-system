const express = require("express");
const router = express.Router();
const { verifyToken, allowRoles } = require("../middleware/authMiddleware");
const {
  createNotice,
  getAllNotices,
  deleteNotice,
  updateNotice,
} = require("../controllers/noticeController");

// Members
router.get("/", verifyToken, getAllNotices);

// Admin / Superadmin
router.post("/", verifyToken, allowRoles("admin", "superadmin"), createNotice);
router.put("/:id", verifyToken, allowRoles("admin", "superadmin"), updateNotice);
router.delete("/:id", verifyToken, allowRoles("admin", "superadmin"), deleteNotice);

module.exports = router;
