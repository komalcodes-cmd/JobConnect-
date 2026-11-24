import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

const createToken = (user) => jwt.sign(
  { id: user._id.toString(), role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (typeof name !== "string" || !name.trim() || !cleanEmail || typeof password !== "string" || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required." });
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }
    if (Buffer.byteLength(password, "utf8") < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ success: false, message: "Password must contain between 8 and 72 characters." });
    }
    if (role && !["jobseeker", "employer"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid account role." });
    }
    const exists = await User.findOne({ email: cleanEmail });
    if (exists) return res.status(409).json({ success: false, message: "An account with this email already exists." });

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: await bcrypt.hash(password, 12),
      role: role || "jobseeker"
    });

    return res.status(201).json({
      success: true,
      message: "Your account has been created.",
      token: createToken(user),
      user: publicUser(user)
    });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "Email is already registered." });
    return res.status(500).json({ success: false, message: "Could not create account." });
  }
};

export const loginUser = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = req.body.password || "";
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password are required." });

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Incorrect email or password." });
    }

    return res.json({ success: true, message: "Login successful.", token: createToken(user), user: publicUser(user) });
  } catch {
    return res.status(500).json({ success: false, message: "Could not log in. Please try again." });
  }
};

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: "Account not found." });
  return res.json({ success: true, user: publicUser(user) });
};
