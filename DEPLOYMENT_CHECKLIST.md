# Deployment Checklist for ExpenseAI RC1

## Phase 1: Environment Preparation

### Backend (Render / Node.js)
- [ ] Connect the GitHub repository to your Render account.
- [ ] Create a new PostgreSQL database instance (if not using Neon directly).
- [ ] Create a new **Web Service**.
- [ ] Set Root Directory to `backend/`.
- [ ] Set Build Command: `npm install && npm run build && npm run db:migrate`
- [ ] Set Start Command: `npm start`
- [ ] Configure the following Environment Variables in the Render Dashboard:
  - `DATABASE_URL`: Your pooled Neon PostgreSQL connection string.
  - `DIRECT_URL`: Your direct Neon PostgreSQL connection string.
  - `JWT_ACCESS_SECRET`: A secure 64-character hex string.
  - `JWT_REFRESH_SECRET`: A different secure 64-character hex string.
  - `AI_PROVIDER`: `gemini`
  - `GEMINI_API_KEY`: Your valid Google Gemini API Key.
  - `PORT`: `3000`
- [ ] Trigger manual deployment. Wait for "Build Successful".

### Frontend (Vercel / Vite)
- [ ] Connect the GitHub repository to your Vercel account.
- [ ] Select **Vite** as the Framework Preset.
- [ ] Set Root Directory to `frontend/`.
- [ ] Set Build Command: `npm run build`.
- [ ] Set Output Directory: `dist`.
- [ ] Configure the following Environment Variables in the Vercel Dashboard:
  - `VITE_API_URL`: The fully qualified domain name of your Render backend service (e.g., `https://expenseai-api.onrender.com`).
- [ ] Trigger manual deployment. Wait for "Ready".

## Phase 2: Post-Deployment Verification
- [ ] Navigate to the Vercel frontend domain in an Incognito window.
- [ ] Verify the Landing Page loads without console errors.
- [ ] Register a new user and verify successful database insertion.
- [ ] Add an expense with a clear description (e.g., "Uber to airport") and verify that the AI Suggestion system triggers and recommends "Transport" or similar.
- [ ] Check the Render logs for any unhandled exceptions or connection drops.

## Phase 3: Launch
- [ ] Map custom domains to both Frontend and Backend (optional).
- [ ] Monitor logs for the first 24 hours.
