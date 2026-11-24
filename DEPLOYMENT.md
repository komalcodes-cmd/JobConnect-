# JobConnect deployment guide

This repository is configured for **GitHub + Render (backend) + Vercel (frontend) + MongoDB Atlas**.

## 1. Prepare GitHub

1. Create a new empty GitHub repository.
2. Open a terminal in the `JobConnect` project root.
3. Run:

   ```bash
   git init
   git add .
   git status
   ```

4. Before committing, confirm that `.env`, `backend/.env`, `frontend/.env`, and all `node_modules` folders are absent from the staged file list.
5. Commit and push:

   ```bash
   git commit -m "Prepare JobConnect for deployment"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git push -u origin main
   ```

## 2. Configure MongoDB Atlas

1. In MongoDB Atlas, create or select the project and cluster.
2. Create a database user with a strong password.
3. In Network Access, allow access from the backend hosting service. For a student demo, `0.0.0.0/0` is the easiest option, but it exposes the cluster to connection attempts from any IP; use a least-privilege database user and strong password. Restrict IPs when your hosting provider offers stable outbound IPs.
4. Copy the Node.js driver connection string and use the database name `jobconnect`.
5. URL-encode special characters in the database password (for example `@` becomes `%40`).

## 3. Deploy the backend on Render

1. Create a **Web Service** and connect the GitHub repository.
2. Set Root Directory to `backend`.
3. Set Build Command to `npm install`.
4. Set Start Command to `npm start`.
5. Add these environment variables:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | A unique random secret with at least 32 characters |
   | `CLIENT_URL` | Your Vercel frontend origin, for example `https://your-site.vercel.app` |

6. Deploy and wait for the service to become live.
7. Open `https://YOUR-RENDER-SERVICE.onrender.com/api/health`. The response should contain `success: true`.

## 4. Deploy the frontend on Vercel

1. Import the same GitHub repository into Vercel.
2. Set Root Directory to `frontend`.
3. Use the Vite framework preset.
4. Set Build Command to `npm run build` and Output Directory to `dist`.
5. Add the environment variable `VITE_API_URL` with your Render backend URL, without a trailing slash, for example `https://your-api.onrender.com`.
6. Deploy the frontend.

## 5. Connect both deployments

1. Copy the final Vercel frontend origin.
2. In Render, update `CLIENT_URL` to that exact origin (no trailing slash).
3. Redeploy the backend if Render does not automatically restart after the environment variable update.
4. Open the Vercel site and check the Backend status in the footer.
5. Register one Jobseeker account and one Employer account. Test the complete workflow in `TESTING.md`.

## Important

- Never commit `.env` files, MongoDB credentials, JWT secrets, or `node_modules`.
- `frontend/.env` is only for local development. Vercel uses `VITE_API_URL` from its Environment Variables settings.
- If the frontend URL changes, update Render's `CLIENT_URL`.
- If the backend URL changes, update Vercel's `VITE_API_URL` and redeploy the frontend.
- A Render free service may sleep when inactive, so the first request after a quiet period can take longer.
- This project accepts a shareable resume URL; it does not upload/store resume files.
