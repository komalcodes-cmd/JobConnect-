import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["jobseeker", "employer"], default: "jobseeker" }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
