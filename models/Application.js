import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    resume: { type: String, trim: true, maxlength: 2048, default: "" },
    coverLetter: { type: String, trim: true, maxlength: 3000, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Reviewed", "Shortlisted", "Rejected", "Selected"],
      default: "Pending"
    }
  },
  { timestamps: true }
);

applicationSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });
export default mongoose.models.Application || mongoose.model("Application", applicationSchema);
