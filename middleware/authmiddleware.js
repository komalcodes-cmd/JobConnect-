import jwt from "jsonwebtoken";
import User from "../models/user.js";

const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ success: false, message: "Please log in to continue." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id role");
    if (!user) return res.status(401).json({ success: false, message: "Account not found. Please log in again." });
    req.user = { id: user._id.toString(), role: user.role };
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Your session is invalid or expired. Please log in again." });
  }
};

export const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "You are not allowed to perform this action." });
  }
  return next();
};

export default authMiddleware;
