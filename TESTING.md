# JobConnect API testing (PowerShell – no Postman required)

Keep the backend running in one VS Code terminal. Run these commands in a second PowerShell terminal.

## 1. Health check

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

## 2. Register a jobseeker

Use a new email address each time you register.

```powershell
$body = @{
  name = "Demo Candidate"
  email = "candidate@example.com"
  password = "Candidate@123"
  role = "jobseeker"
} | ConvertTo-Json

$registered = Invoke-RestMethod -Uri "http://localhost:5000/api/register" -Method POST -ContentType "application/json" -Body $body
$token = $registered.token
$headers = @{ Authorization = "Bearer $token" }
```

## 3. Register an employer

```powershell
$body = @{
  name = "Demo Employer"
  email = "employer@example.com"
  password = "Employer@123"
  role = "employer"
} | ConvertTo-Json

$employer = Invoke-RestMethod -Uri "http://localhost:5000/api/register" -Method POST -ContentType "application/json" -Body $body
$employerToken = $employer.token
$employerHeaders = @{ Authorization = "Bearer $employerToken" }
```

## 4. Employer posts a job

```powershell
$jobBody = @{
  title = "Frontend Developer"
  company = "JobConnect Demo"
  location = "Lucknow"
  description = "Build responsive interfaces using React and JavaScript."
  salary = "4-6 LPA"
  skills = @("React", "JavaScript", "CSS")
  jobType = "Full Time"
} | ConvertTo-Json

$jobResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/jobs" -Method POST -Headers $employerHeaders -ContentType "application/json" -Body $jobBody
$jobId = $jobResponse.job._id
```

## 5. Jobseeker applies

```powershell
$applyBody = @{
  jobId = $jobId
  resume = "https://example.com/my-resume"
  coverLetter = "I am interested in this opportunity."
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/applications" -Method POST -Headers $headers -ContentType "application/json" -Body $applyBody
```

## 6. Employer checks applicants and updates status

```powershell
$applications = Invoke-RestMethod -Uri "http://localhost:5000/api/jobs/$jobId/applications" -Method GET -Headers $employerHeaders
$applicationId = $applications.applications[0]._id

$statusBody = @{ status = "Shortlisted" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/applications/$applicationId/status" -Method PUT -Headers $employerHeaders -ContentType "application/json" -Body $statusBody
```

## 7. Jobseeker checks their applications

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/my-applications" -Method GET -Headers $headers
```

Use your own test email addresses. Do not paste tokens, passwords or your MongoDB URI into screenshots or public GitHub issues.


## 8. Pre-deployment checklist

- [ ] `backend/.env` exists locally and contains the real `MONGO_URI`, `JWT_SECRET`, and local `CLIENT_URL`.
- [ ] `frontend/.env` contains `VITE_API_URL=http://localhost:5000` for local testing.
- [ ] Backend starts with `npm start` and `/api/health` returns `success: true`.
- [ ] A jobseeker can register, log in, apply once per job, and view application status.
- [ ] An employer can register, log in, post/edit/delete only their own jobs, view applicants, and update application status.
- [ ] `npm run build` succeeds in the frontend folder.
- [ ] `.env` files and `node_modules` are not staged for GitHub.

Do not use the demo passwords or example URLs for real accounts.
