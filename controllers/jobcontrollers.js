import mongoose from "mongoose";
import Job from "../models/job.js";
import Application from "../models/Application.js";

const validId = (id) => mongoose.Types.ObjectId.isValid(id);

const normalizeSkills = (skills) => {
  if (Array.isArray(skills)) return skills.map((s) => String(s).trim()).filter(Boolean);
  if (typeof skills === "string") return skills.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
};

export const createJob = async (req, res) => {
  try {
    const { title, company, location, description, salary, skills, jobType } = req.body;
    if (![title, company, location, description].every((v) => typeof v === "string" && v.trim())) {
      return res.status(400).json({ success: false, message: "Title, company, location and description are required." });
    }
    const job = await Job.create({
      title: title.trim(), company: company.trim(), location: location.trim(),
      description: description.trim(), salary: salary || "",
      skills: normalizeSkills(skills), jobType: jobType || "Full Time", postedBy: req.user.id
    });
    return res.status(201).json({ success: true, message: "Job posted successfully.", job });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Could not post job." });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const { keyword = "", location = "", type = "" } = req.query;
    const filter = {};
    if (keyword.trim()) {
      const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [{ title: regex }, { company: regex }, { description: regex }, { skills: regex }];
    }
    if (location.trim()) filter.location = { $regex: location.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    if (type) filter.jobType = type;

    const jobs = await Job.find(filter).populate("postedBy", "name").sort({ createdAt: -1 }).lean();
    return res.json({ success: true, totalJobs: jobs.length, jobs });
  } catch {
    return res.status(500).json({ success: false, message: "Could not load jobs." });
  }
};


export const getJobById = async (req, res) => {
  if (!validId(req.params.jobId)) return res.status(400).json({ success: false, message: "Invalid job ID." });
  const job = await Job.findById(req.params.jobId).populate("postedBy", "name").lean();
  if (!job) return res.status(404).json({ success: false, message: "Job not found." });
  return res.json({ success: true, job });
};

export const getMyJobs = async (req, res) => {
  const jobs = await Job.find({ postedBy: req.user.id }).sort({ createdAt: -1 });
  return res.json({ success: true, jobs });
};

export const updateJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    if (!validId(jobId)) return res.status(400).json({ success: false, message: "Invalid job ID." });
    const allowed = ["title", "company", "location", "description", "salary", "skills", "jobType"];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = key === "skills" ? normalizeSkills(req.body[key]) : req.body[key];
    const job = await Job.findOneAndUpdate({ _id: jobId, postedBy: req.user.id }, updates, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ success: false, message: "Job not found or you do not own this job." });
    return res.json({ success: true, message: "Job updated successfully.", job });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message || "Could not update job." });
  }
};

export const deleteJob = async (req, res) => {
  if (!validId(req.params.jobId)) return res.status(400).json({ success: false, message: "Invalid job ID." });
  const job = await Job.findOneAndDelete({ _id: req.params.jobId, postedBy: req.user.id });
  if (!job) return res.status(404).json({ success: false, message: "Job not found or you do not own this job." });
  await Application.deleteMany({ jobId: job._id });
  return res.json({ success: true, message: "Job and its related applications deleted successfully." });
};
