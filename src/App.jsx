import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Search, MapPin, BriefcaseBusiness, Users, Building2, TrendingUp,
  LogOut, Plus, Pencil, Trash2, X, ArrowRight, FileText,
  CheckCircle2, AlertCircle, RefreshCw, ExternalLink
} from "lucide-react";
import "./App.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jobconnect_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const emptyJob = { title: "", company: "", location: "", description: "", salary: "", skills: "", jobType: "Full Time" };
const statusOptions = ["Pending", "Reviewed", "Shortlisted", "Rejected", "Selected"];

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("jobconnect_user") || "null"); } catch { return null; }
  });
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [employerApplications, setEmployerApplications] = useState({});
  const [apiStatus, setApiStatus] = useState("Checking...");
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "", role: "jobseeker" });
  const [jobModal, setJobModal] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [applyJob, setApplyJob] = useState(null);
  const [applyForm, setApplyForm] = useState({ resume: "", coverLetter: "" });
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [activeView, setActiveView] = useState("home");
  const [selectedApplicationsJob, setSelectedApplicationsJob] = useState(null);

  const notify = (text, type = "success") => {
    setNotice({ text, type });
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => setNotice({ text: "", type: "" }), 4500);
  };

  const fetchJobs = useCallback(async () => {
    try {
      setLoadingJobs(true);
      const response = await api.get("/api/jobs");
      setJobs(response.data.jobs || []);
      setApiStatus("Connected");
    } catch (error) {
      setApiStatus("Not connected");
      notify(error.response?.data?.message || "Could not load jobs. Check that the backend is running.", "error");
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const fetchDashboard = useCallback(async (currentUser = user) => {
    if (!currentUser) return;
    try {
      if (currentUser.role === "employer") {
        const response = await api.get("/api/my-jobs");
        setMyJobs(response.data.jobs || []);
      } else {
        const response = await api.get("/api/my-applications");
        setApplications(response.data.applications || []);
      }
    } catch (error) {
      notify(error.response?.data?.message || "Could not load your dashboard.", "error");
    }
  }, [user]);

  useEffect(() => {
    api.get("/api/health").then(() => setApiStatus("Connected")).catch(() => setApiStatus("Not connected"));
    fetchJobs();
    const token = localStorage.getItem("jobconnect_token");
    if (token) {
      api.get("/api/profile")
        .then((response) => {
          setUser(response.data.user);
          localStorage.setItem("jobconnect_user", JSON.stringify(response.data.user));
        })
        .catch(() => {
          localStorage.removeItem("jobconnect_token");
          localStorage.removeItem("jobconnect_user");
          setUser(null);
        });
    }
  }, [fetchJobs]);

  useEffect(() => { if (user) fetchDashboard(user); }, [user, fetchDashboard]);

  const filteredJobs = useMemo(() => {
    const key = keyword.trim().toLowerCase();
    const place = location.trim().toLowerCase();
    return jobs.filter((job) => {
      const haystack = [job.title, job.company, job.description, ...(job.skills || [])].join(" ").toLowerCase();
      return (!key || haystack.includes(key)) && (!place || (job.location || "").toLowerCase().includes(place));
    });
  }, [jobs, keyword, location]);

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthForm({ name: "", email: "", password: "", role: "jobseeker" });
    setAuthOpen(true);
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const endpoint = authMode === "login" ? "/api/login" : "/api/register";
      const payload = authMode === "login"
        ? { email: authForm.email, password: authForm.password }
        : authForm;
      const response = await api.post(endpoint, payload);
      localStorage.setItem("jobconnect_token", response.data.token);
      localStorage.setItem("jobconnect_user", JSON.stringify(response.data.user));
      setUser(response.data.user);
      setAuthOpen(false);
      setActiveView("dashboard");
      notify(response.data.message || "Welcome to JobConnect!");
    } catch (error) {
      notify(error.response?.data?.message || "Authentication failed. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("jobconnect_token");
    localStorage.removeItem("jobconnect_user");
    setUser(null);
    setMyJobs([]);
    setApplications([]);
    setEmployerApplications({});
    setActiveView("home");
    notify("You have been logged out.");
  };

  const openCreateJob = () => {
    setEditingJobId(null);
    setJobForm(emptyJob);
    setJobModal(true);
  };

  const openEditJob = (job) => {
    setEditingJobId(job._id);
    setJobForm({ ...emptyJob, ...job, skills: (job.skills || []).join(", ") });
    setJobModal(true);
  };

  const saveJob = async (event) => {
    event.preventDefault();
    setBusy(true);
    const payload = { ...jobForm, skills: jobForm.skills.split(",").map((s) => s.trim()).filter(Boolean) };
    try {
      if (editingJobId) await api.put(`/api/jobs/${editingJobId}`, payload);
      else await api.post("/api/jobs", payload);
      setJobModal(false);
      await fetchJobs();
      await fetchDashboard(user);
      notify(editingJobId ? "Job updated successfully." : "Your job has been posted.");
    } catch (error) {
      notify(error.response?.data?.message || "Could not save this job.", "error");
    } finally {
      setBusy(false);
    }
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;
    try {
      await api.delete(`/api/jobs/${jobId}`);
      if (selectedApplicationsJob?._id === jobId) setSelectedApplicationsJob(null);
      await fetchJobs();
      await fetchDashboard(user);
      notify("Job deleted successfully.");
    } catch (error) {
      notify(error.response?.data?.message || "Could not delete this job.", "error");
    }
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    if (!applyJob) return;
    setBusy(true);
    try {
      await api.post("/api/applications", { jobId: applyJob._id, ...applyForm });
      setApplyJob(null);
      setApplyForm({ resume: "", coverLetter: "" });
      await fetchDashboard(user);
      notify("Your application has been submitted.");
    } catch (error) {
      notify(error.response?.data?.message || "Could not submit application.", "error");
    } finally {
      setBusy(false);
    }
  };

  const loadEmployerApplications = async (job) => {
    try {
      const response = await api.get(`/api/jobs/${job._id}/applications`);
      setEmployerApplications((prev) => ({ ...prev, [job._id]: response.data.applications || [] }));
      setSelectedApplicationsJob(job);
    } catch (error) {
      notify(error.response?.data?.message || "Could not load applicants.", "error");
    }
  };

  const changeApplicationStatus = async (applicationId, status, jobId) => {
    try {
      await api.put(`/api/applications/${applicationId}/status`, { status });
      const job = myJobs.find((item) => item._id === jobId);
      if (job) await loadEmployerApplications(job);
      notify("Application status updated.");
    } catch (error) {
      notify(error.response?.data?.message || "Could not update status.", "error");
    }
  };

  const applyClick = (job) => {
    if (!user) return openAuth("login");
    if (user.role !== "jobseeker") return notify("Only jobseeker accounts can apply for jobs.", "error");
    setApplyJob(job);
  };

  const showHome = () => { setActiveView("home"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const showJobs = () => { setActiveView("home"); document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" }); };

  return (
    <div className="app">
      <nav className="navbar">
        <button className="logo logo-button" onClick={showHome}>
          <span className="logo-icon"><BriefcaseBusiness size={23} /></span>JobConnect
        </button>
        <div className="nav-links">
          <button onClick={showHome}>Home</button>
          <button onClick={showJobs}>Find Jobs</button>
          {user && <button onClick={() => { setActiveView("dashboard"); fetchDashboard(user); }}>Dashboard</button>}
        </div>
        <div className="nav-buttons">
          {user ? (
            <>
              <span className="welcome-user">Hi, {user.name.split(" ")[0]}</span>
              <button className="outline-btn" onClick={logout}><LogOut size={16} /> Logout</button>
            </>
          ) : (
            <>
              <button className="login-btn" onClick={() => openAuth("login")}>Login</button>
              <button className="signup-btn" onClick={() => openAuth("register")}>Sign Up</button>
            </>
          )}
        </div>
      </nav>

      {notice.text && <div className={`toast ${notice.type}`} role="status">
        {notice.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
        {notice.text}
        <button onClick={() => setNotice({ text: "", type: "" })} aria-label="Close notification"><X size={16} /></button>
      </div>}

      {activeView === "home" ? (
        <>
          <section className="hero" id="home">
            <div className="hero-content">
              <span className="tag">YOUR CAREER, OUR PRIORITY</span>
              <h1>Find Your <span>Dream Job</span><br />And Build Your Future</h1>
              <p>Discover exciting career opportunities, connect with top companies and take the next step in your professional journey.</p>
              <form className="search-box" onSubmit={(e) => { e.preventDefault(); showJobs(); }}>
                <div className="search-field"><Search size={21} /><input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Job title or keyword" /></div>
                <div className="search-field"><MapPin size={21} /><input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" /></div>
                <button className="search-btn" type="submit">Search Jobs <ArrowRight size={16} /></button>
              </form>
              <p className="popular">Popular: Data Analyst, Developer, Designer, Marketing</p>
            </div>
            <div className="hero-visual">
              <div className="visual-circle"><BriefcaseBusiness size={110} strokeWidth={1.2} /></div>
              <div className="floating-card"><span className="card-icon"><TrendingUp size={22} /></span><div><strong>Career Growth</strong><small>Find opportunities</small></div></div>
              <div className="floating-card second-card"><span className="card-icon"><Users size={22} /></span><div><strong>Top Companies</strong><small>Connect and grow</small></div></div>
            </div>
          </section>

          <section className="stats" id="about">
            <div className="stat-item"><BriefcaseBusiness /><div><h2>{jobs.length}</h2><p>Available Jobs</p></div></div>
            <div className="stat-item"><Building2 /><div><h2>{new Set(jobs.map((job) => job.company)).size}</h2><p>Companies</p></div></div>
            <div className="stat-item"><Users /><div><h2>2 Roles</h2><p>Jobseekers & Employers</p></div></div>
          </section>

          <section className="jobs-section" id="jobs">
            <div className="section-heading"><div><span className="tag">EXPLORE OPPORTUNITIES</span><h2>Find the Right Job for You</h2><p>Your next career opportunity starts with JobConnect.</p></div><button className="refresh-btn" onClick={fetchJobs}><RefreshCw size={16} /> Refresh</button></div>
            {loadingJobs ? <div className="empty-jobs"><p>Loading opportunities...</p></div> :
              filteredJobs.length ? <div className="jobs-grid">{filteredJobs.map((job) => <JobCard key={job._id} job={job} onApply={() => applyClick(job)} />)}</div> :
              <div className="empty-jobs"><BriefcaseBusiness size={42} /><h3>{jobs.length ? "No matching jobs" : "Exciting Opportunities Await!"}</h3><p>{jobs.length ? "Try a different keyword or location." : "New job listings will appear here when employers post opportunities."}</p></div>}
          </section>
        </>
      ) : (
        <main className="dashboard-page">
          <div className="dashboard-heading">
            <div><span className="tag">YOUR WORKSPACE</span><h1>{user?.role === "employer" ? "Employer Dashboard" : "Jobseeker Dashboard"}</h1><p>Welcome back, {user?.name}. Manage your activity on JobConnect.</p></div>
            {user?.role === "employer" && <button className="primary-btn" onClick={openCreateJob}><Plus size={17} /> Post a Job</button>}
          </div>

          {user?.role === "employer" ? (
            <div className="dashboard-grid">
              <section className="panel jobs-panel">
                <div className="panel-title"><div><h2>Your Job Listings</h2><p>{myJobs.length} jobs posted</p></div><BriefcaseBusiness /></div>
                {myJobs.length ? myJobs.map((job) => <div className="managed-job" key={job._id}>
                  <div className="managed-job-info"><h3>{job.title}</h3><p>{job.company} · {job.location}</p><small>Posted {new Date(job.createdAt).toLocaleDateString()}</small></div>
                  <div className="managed-actions">
                    <button className="small-btn" onClick={() => loadEmployerApplications(job)}><Users size={15} /> Applicants</button>
                    <button className="icon-btn" title="Edit job" onClick={() => openEditJob(job)}><Pencil size={16} /></button>
                    <button className="icon-btn danger" title="Delete job" onClick={() => deleteJob(job._id)}><Trash2 size={16} /></button>
                  </div>
                </div>) : <div className="empty-state"><BriefcaseBusiness size={32} /><h3>No jobs posted yet</h3><p>Post your first opening to start receiving applications.</p><button className="primary-btn" onClick={openCreateJob}><Plus size={16} /> Post your first job</button></div>}
              </section>
              <section className="panel applicant-panel">
                <div className="panel-title"><div><h2>Applicants</h2><p>{selectedApplicationsJob ? `For ${selectedApplicationsJob.title}` : "Select a job to view candidates"}</p></div><Users /></div>
                {selectedApplicationsJob ? (employerApplications[selectedApplicationsJob._id] || []).length ? employerApplications[selectedApplicationsJob._id].map((application) => <div className="application-row" key={application._id}>
                  <div className="applicant-details">
                    <strong>{application.candidateId?.name || "Candidate"}</strong>
                    <p>{application.candidateId?.email}</p>
                    <small>Applied {new Date(application.createdAt).toLocaleDateString()}</small>
                    {application.resume && <a className="resume-link" href={application.resume} target="_blank" rel="noreferrer">View resume <ExternalLink size={13} /></a>}
                    {application.coverLetter && <p className="cover-letter">{application.coverLetter}</p>}
                  </div>
                  <select aria-label={`Application status for ${application.candidateId?.name || "candidate"}`} value={application.status} onChange={(e) => changeApplicationStatus(application._id, e.target.value, selectedApplicationsJob._id)}>{statusOptions.map((s) => <option key={s}>{s}</option>)}</select>
                </div>) : <div className="empty-state compact"><FileText size={28} /><p>No applications received for this job yet.</p></div> : <div className="empty-state compact"><Users size={28} /><p>Click “Applicants” on one of your job listings.</p></div>}
              </section>
            </div>
          ) : (
            <section className="panel">
              <div className="panel-title"><div><h2>My Applications</h2><p>Track the jobs you have applied for.</p></div><FileText /></div>
              {applications.length ? <div className="table-wrap"><table><thead><tr><th>Job</th><th>Company</th><th>Location</th><th>Applied on</th><th>Status</th></tr></thead><tbody>{applications.map((item) => <tr key={item._id}><td>{item.jobId?.title || "Job removed"}</td><td>{item.jobId?.company || "—"}</td><td>{item.jobId?.location || "—"}</td><td>{new Date(item.createdAt).toLocaleDateString()}</td><td><span className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><FileText size={32} /><h3>No applications yet</h3><p>Explore jobs and apply to start tracking your applications here.</p><button className="primary-btn" onClick={showJobs}>Explore Jobs <ArrowRight size={16} /></button></div>}
            </section>
          )}
        </main>
      )}

      <footer><h3>JobConnect</h3><p>Connecting Talent With Opportunities.</p><small>© {new Date().getFullYear()} JobConnect. All rights reserved.</small><p className="api-status"><span className={`status-dot ${apiStatus === "Connected" ? "online" : ""}`} /> Backend: {apiStatus}</p></footer>

      {authOpen && <Modal title={authMode === "login" ? "Welcome back" : "Create your JobConnect account"} onClose={() => setAuthOpen(false)}>
        <form className="modal-form" onSubmit={submitAuth}>
          {authMode === "register" && <label>Full name<input required value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Your full name" /></label>}
          <label>Email address<input required type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@example.com" /></label>
          <label>Password<input required type="password" minLength="8" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="At least 8 characters" /></label>
          {authMode === "register" && <label>Register as<select value={authForm.role} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}><option value="jobseeker">Jobseeker</option><option value="employer">Employer</option></select></label>}
          <button className="primary-btn full-btn" disabled={busy}>{busy ? "Please wait..." : authMode === "login" ? "Login" : "Create account"}</button>
        </form>
        <p className="modal-switch">{authMode === "login" ? "New to JobConnect?" : "Already have an account?"} <button onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}>{authMode === "login" ? "Create an account" : "Login"}</button></p>
      </Modal>}

      {jobModal && <Modal title={editingJobId ? "Edit job listing" : "Post a new job"} onClose={() => setJobModal(false)} wide>
        <form className="modal-form two-col" onSubmit={saveJob}>
          <label>Job title<input required value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} placeholder="e.g. Frontend Developer" /></label>
          <label>Company<input required value={jobForm.company} onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })} placeholder="Company name" /></label>
          <label>Location<input required value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} placeholder="e.g. Lucknow / Remote" /></label>
          <label>Salary<input value={jobForm.salary} onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })} placeholder="e.g. ₹4–6 LPA" /></label>
          <label>Job type<select value={jobForm.jobType} onChange={(e) => setJobForm({ ...jobForm, jobType: e.target.value })}><option>Full Time</option><option>Part Time</option><option>Internship</option><option>Contract</option></select></label>
          <label>Skills <span className="field-hint">(comma separated)</span><input value={jobForm.skills} onChange={(e) => setJobForm({ ...jobForm, skills: e.target.value })} placeholder="React, JavaScript, CSS" /></label>
          <label className="full-span">Job description<textarea required rows="5" value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} placeholder="Describe the role and responsibilities..." /></label>
          <button className="primary-btn full-btn full-span" disabled={busy}>{busy ? "Saving..." : editingJobId ? "Save changes" : "Publish job"}</button>
        </form>
      </Modal>}

      {applyJob && <Modal title={`Apply for ${applyJob.title}`} onClose={() => setApplyJob(null)}>
        <form className="modal-form" onSubmit={submitApplication}>
          <p className="form-intro">{applyJob.company} · {applyJob.location}</p>
          <label>Resume link <span className="field-hint">(Google Drive / portfolio URL)</span><input type="url" value={applyForm.resume} onChange={(e) => setApplyForm({ ...applyForm, resume: e.target.value })} placeholder="https://..." /></label>
          <label>Cover letter <textarea rows="4" value={applyForm.coverLetter} onChange={(e) => setApplyForm({ ...applyForm, coverLetter: e.target.value })} placeholder="Tell the employer why you are a good fit..." /></label>
          <button className="primary-btn full-btn" disabled={busy}>{busy ? "Submitting..." : "Submit application"}</button>
        </form>
      </Modal>}
    </div>
  );
}

function JobCard({ job, onApply }) {
  return <article className="job-card">
    <div className="job-card-top"><span className="job-icon"><BriefcaseBusiness size={24} /></span><span className="job-type">{job.jobType || "Full Time"}</span></div>
    <h3>{job.title}</h3><h4>{job.company}</h4>
    <p className="job-location"><MapPin size={15} />{job.location}</p>
    <p className="job-description">{job.description}</p>
    {!!job.skills?.length && <div className="job-skills">{job.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>}
    <div className="job-card-bottom"><strong>{job.salary || "Salary not disclosed"}</strong><button className="apply-btn" onClick={onApply}>Apply Now <ArrowRight size={14} /></button></div>
  </article>;
}

function Modal({ title, onClose, children, wide = false }) {
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-header"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={19} /></button></div>
      {children}
    </section>
  </div>;
}

export default App;
