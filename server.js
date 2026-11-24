import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authMiddleware, { allowRoles } from "./middleware/authmiddleware.js";
import { registerUser, loginUser, getProfile } from "./controllers/usercontrollers.js";
import { createJob, getAllJobs, getMyJobs, updateJob, deleteJob, getJobById } from "./controllers/jobcontrollers.js";
import { applyForJob, getMyApplications, getJobApplications, updateApplicationStatus } from "./controllers/applicationcontrollers.js";

dotenv.config();

const app = express();
const safe = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  next();
});
app.use(cors({
  origin(origin, callback) {
    // Requests without an Origin header include health checks and local CLI tools.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("This origin is not allowed by the API CORS policy."));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400
}));
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => res.json({ success: true, message: "Welcome to JobConnect API." }));
app.get("/api/health", (_req, res) => res.json({ success: true, message: "JobConnect API is running.", project: "JobConnect" }));

app.post("/api/register", safe(registerUser));
app.post("/api/login", safe(loginUser));
app.get("/api/profile", authMiddleware, safe(getProfile));

app.get("/api/jobs", safe(getAllJobs));
app.get("/api/jobs/:jobId", safe(getJobById));
app.post("/api/jobs", authMiddleware, allowRoles("employer"), safe(createJob));
app.get("/api/my-jobs", authMiddleware, allowRoles("employer"), safe(getMyJobs));
app.put("/api/jobs/:jobId", authMiddleware, allowRoles("employer"), safe(updateJob));
app.delete("/api/jobs/:jobId", authMiddleware, allowRoles("employer"), safe(deleteJob));

app.post("/api/applications", authMiddleware, allowRoles("jobseeker"), safe(applyForJob));
app.get("/api/my-applications", authMiddleware, allowRoles("jobseeker"), safe(getMyApplications));
app.get("/api/jobs/:jobId/applications", authMiddleware, allowRoles("employer"), safe(getJobApplications));
app.put("/api/applications/:applicationId/status", authMiddleware, allowRoles("employer"), safe(updateApplicationStatus));

app.use((req, res) => res.status(404).json({ success: false, message: "API route not found." }));
app.use((err, _req, res, _next) => {
  if (err.message?.includes("CORS")) {
    return res.status(403).json({ success: false, message: "This website is not allowed to access the API. Check CLIENT_URL." });
  }
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ success: false, message: "Invalid JSON request body." });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request body is too large." });
  }
  console.error("API error:", err);
  return res.status(500).json({ success: false, message: "Unexpected server error." });
});

const PORT = Number(process.env.PORT) || 5000;
const startServer = async () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET is missing or too short. Set a random secret of at least 32 characters.");
  }
  await connectDB();
  return app.listen(PORT, () => console.log(`JobConnect API is listening on port ${PORT}`));
};

startServer().catch((error) => {
  console.error("Server startup failed:", error.message);
  process.exit(1);
});

export default app;
