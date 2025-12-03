const jwt = require("jsonwebtoken");

// ✅ Verify token
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("❌ Invalid token:", error);
    res.status(403).json({ message: "Invalid token" });
  }
};

// ✅ Allow roles
exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes(req.user.role))
      return res.status(403).json({ message: "Access forbidden: insufficient permissions" });
    next();
  };
};


