import mongoose from "mongoose";
import Application from "../models/Application.js";
import Job from "../models/job.js";

const statuses = ["Pending", "Reviewed", "Shortlisted", "Rejected", "Selected"];

export const applyForJob = async (req, res) => {
  try {
    const { jobId, resume = "", coverLetter = "" } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(jobId)) return res.status(400).json({ success: false, message: "A valid job is required." });
    const job = await Job.findById(jobId).select("_id");
    if (!job) return res.status(404).json({ success: false, message: "This job is no longer available." });
    if (typeof resume !== "string" || (resume.trim() && !/^https?:\/\//i.test(resume.trim()))) {
      return res.status(400).json({ success: false, message: "Resume must be a valid http or https link." });
    }
    if (typeof coverLetter !== "string" || coverLetter.length > 3000) {
      return res.status(400).json({ success: false, message: "Cover letter must be text with 3000 characters or fewer." });
    }
    const application = await Application.create({ candidateId: req.user.id, jobId, resume: resume.trim(), coverLetter: coverLetter.trim() });
    return res.status(201).json({ success: true, message: "Application submitted successfully.", application });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "You have already applied for this job." });
    return res.status(400).json({ success: false, message: error.message || "Could not submit application." });
  }
};

export const getMyApplications = async (req, res) => {
  const applications = await Application.find({ candidateId: req.user.id })
    .populate({ path: "jobId", select: "title company location salary jobType postedBy" })
    .sort({ createdAt: -1 });
  return res.json({ success: true, applications });
};

export const getJobApplications = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.jobId)) return res.status(400).json({ success: false, message: "Invalid job ID." });
  const job = await Job.findOne({ _id: req.params.jobId, postedBy: req.user.id });
  if (!job) return res.status(404).json({ success: false, message: "Job not found or you do not own this job." });
  const applications = await Application.find({ jobId: job._id })
    .populate("candidateId", "name email")
    .populate("jobId", "title company")
    .sort({ createdAt: -1 });
  return res.json({ success: true, totalApplications: applications.length, applications });
};

export const updateApplicationStatus = async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;
  if (!mongoose.Types.ObjectId.isValid(applicationId)) return res.status(400).json({ success: false, message: "Invalid application ID." });
  if (!statuses.includes(status)) return res.status(400).json({ success: false, message: "Please choose a valid application status." });
  const application = await Application.findById(applicationId);
  if (!application) return res.status(404).json({ success: false, message: "Application not found." });
  const ownsJob = await Job.exists({ _id: application.jobId, postedBy: req.user.id });
  if (!ownsJob) return res.status(403).json({ success: false, message: "You cannot update this application." });
  application.status = status;
  await application.save();
  return res.json({ success: true, message: "Application status updated.", application });
};
