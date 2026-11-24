# JobConnect – Full Stack Job Portal

JobConnect is a responsive full-stack job portal built with React, Vite, Node.js, Express and MongoDB. It supports two account types: **Jobseeker** and **Employer**.
<img width="1761" height="944" alt="Screenshot 2026-11-24 222205" src="https://github.com/user-attachments/assets/578a429f-b100-46c3-9d6a-defc2f62c27b" />



## Features

### Public
- Responsive landing page and job listings
- Search jobs by title, company, skills and location
- View job details on each listing card

### Authentication and roles
- Register and login with email and password
- Password hashing with bcrypt
- JWT-based authentication
- Role-based access control (Jobseeker / Employer)
- Protected API endpoints and profile retrieval

- <img width="1746" height="868" alt="Screenshot 2026-11-24 222215" src="https://github.com/user-attachments/assets/4aafc798-e083-48ec-bbc0-db031aa25235" />


### Jobseeker
- Browse and apply for jobs
- Submit an optional resume URL and cover letter
- Prevent duplicate applications
- View application history and status

- <img width="1837" height="756" alt="Screenshot 2026-11-24 224002" src="https://github.com/user-attachments/assets/a88164e2-453a-4f32-a13a-12f774e3fb00" />



### Employer
- Create, edit and delete own job listings
- View applicants for own jobs, including their resume link and cover letter
- Update application status (Pending, Reviewed, Shortlisted, Rejected, Selected)

![Uploading Screenshot 2026-11-24 224002.png…]()

## Tech stack
- Frontend: React, Vite, Axios, Lucide React
- Backend: Node.js, Express
- Database: MongoDB Atlas / MongoDB
- Authentication: JWT and bcryptjs
- Version control: Git and GitHub

- <img width="1834" height="806" alt="Screenshot 2026-11-24 224014" src="https://github.com/user-attachments/assets/01ed08fe-7544-4275-807f-ced02d612308" />


## Project structure

```text
JobConnect/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   ├── public/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── index.html
├── .gitignore
└── README.md
```

## Run locally

### Requirements
- Node.js 20.19 or newer (Node.js 22 LTS recommended)
- npm
- MongoDB Atlas account or local MongoDB

### 1. Configure MongoDB
1. Create a MongoDB Atlas cluster (or use an existing cluster).
2. Create a database user under **Database Access**.
3. Add your current IP under **Network Access**.
4. Copy the MongoDB connection string and replace the username, password and database name as needed.

### 2. Configure backend
Open a terminal in the `backend` folder:

```bash
npm install
```

Copy `.env.example` to `.env` and fill in real values:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/jobconnect
JWT_SECRET=generate_a_random_secret_at_least_32_characters_long
```

Start backend:

```bash
npm run dev
```

Check `http://localhost:5000/api/health`.

### 3. Configure frontend
Open a second terminal in the `frontend` folder:

```bash
npm install
```

Copy `.env.example` to `.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start frontend:

```bash
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Main REST API endpoints

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/register` | Public | Create account |
| POST | `/api/login` | Public | Login |
| GET | `/api/profile` | Authenticated | Get current profile |
| GET | `/api/jobs` | Public | List/search jobs |
| GET | `/api/jobs/:jobId` | Public | Get one job |
| POST | `/api/jobs` | Employer | Create a job |
| GET | `/api/my-jobs` | Employer | List own jobs |
| PUT | `/api/jobs/:jobId` | Employer (owner) | Edit own job |
| DELETE | `/api/jobs/:jobId` | Employer (owner) | Delete own job |
| POST | `/api/applications` | Jobseeker | Apply for a job |
| GET | `/api/my-applications` | Jobseeker | View own applications |
| GET | `/api/jobs/:jobId/applications` | Employer (owner) | View applicants |
| PUT | `/api/applications/:applicationId/status` | Employer (owner) | Update application status |

Send the JWT as an HTTP header for protected routes:

```http
Authorization: Bearer <your_jwt_token>
```

## GitHub

From the project root:

```bash
git init
git add .
git commit -m "Initial JobConnect full-stack application"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repository>.git
git push -u origin main
```

Never commit `.env`, passwords, database connection strings, JWT secrets or `node_modules`. The `.gitignore` files exclude these.

## Deployment

### MongoDB Atlas
Use your Atlas connection string as the backend environment variable `MONGO_URI`. Add the deployed frontend URL to `CLIENT_URL`.

### Backend on Render
- Create a **Web Service** from the GitHub repository.
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Add environment variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`.
- Set `CLIENT_URL` to your deployed Vercel frontend URL.

### Frontend on Vercel
- Import the same GitHub repository.
- Root Directory: `frontend`
- Framework preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Add environment variable `VITE_API_URL` with your deployed Render backend URL (without a trailing slash).

After deployment, redeploy the frontend if its `VITE_API_URL` changes. Update Render's `CLIENT_URL` with the exact frontend origin (include `https://`, and do not add a trailing slash). If you use more than one frontend origin, separate them with commas.

## Important notes
- Do not upload `.env` files, credentials, or `node_modules` to GitHub. Only commit the provided `.env.example` templates.
- Set a unique `JWT_SECRET` of at least 32 characters in the backend hosting environment. Never reuse your MongoDB password as the JWT secret.
- If a database password has ever been pasted into a chat, screenshot, or public file, rotate it in MongoDB Atlas before deployment.
- This project stores resume links, not uploaded resume files. Users can provide a shareable resume URL.
- For production use, add email verification, password reset, rate limiting, stronger monitoring and a dedicated file-storage service before handling real user data.
