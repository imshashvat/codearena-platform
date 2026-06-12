# 🏆 CodeArena Elite — Deployment Guide

A full-stack competitive coding platform with real-time code evaluation, contests, and proctoring.

## Tech Stack
- **Frontend:** Vite + React + TypeScript → deployed to **Vercel**
- **Backend:** Node.js + Express + MongoDB → deployed to **Render (Docker)**
- **Database:** MongoDB Atlas (free tier)
- **Code Judge:** Built-in runner (Python3, C, C++, Java, JavaScript)

---

## 🗄️ Step 1: Set Up MongoDB Atlas

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and sign up / log in
2. Click **"Build a Database"** → choose **Free (M0)**
3. Choose a cloud provider (AWS) and region closest to you
4. Set a **username** and **password** (save these!)
5. Under **"Network Access"**, click **"Add IP Address"** → click **"Allow Access from Anywhere"** (0.0.0.0/0)
6. Click **"Connect"** on your cluster → **"Drivers"** → copy the connection string

Your connection string looks like:
```
mongodb+srv://admin:yourpassword@cluster0.abc12.mongodb.net/codearena?retryWrites=true&w=majority
```

---

## ⚙️ Step 2: Deploy Backend to Render

1. Go to [https://render.com](https://render.com) and sign up / log in with GitHub
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repo: `imshashvat/codearena-platform`
4. Configure the service:
   - **Name:** `codearena-backend`
   - **Root Directory:** `code-evaluator-backend`
   - **Environment:** `Docker`
   - **Instance Type:** `Free`
5. Under **Environment Variables**, add these:

| Key | Value |
|-----|-------|
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A long random string (run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) |
| `FRONTEND_URL` | _(leave blank for now, add after frontend deployment)_ |

6. Click **"Create Web Service"**
7. Wait for the Docker build to complete (~5-10 minutes first time)
8. Your backend URL will be: `https://codearena-backend.onrender.com`

> **Note:** Free tier Render services spin down after 15 minutes of inactivity. First request may take ~30 seconds to wake up.

---

## 🌐 Step 3: Deploy Frontend to Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign up / log in with GitHub
2. Click **"Add New Project"**
3. Import your repo: `imshashvat/codearena-platform`
4. Configure the project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `code-arena-elite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Under **Environment Variables**, add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://codearena-backend.onrender.com/api` |

6. Click **"Deploy"**
7. Your frontend URL will be: `https://codearena-elite.vercel.app` (or similar)

---

## 🔗 Step 4: Connect Frontend ↔ Backend (CORS)

After both are deployed:

1. Go to your **Render** dashboard → `codearena-backend` → **Environment**
2. Add/update:
   - `FRONTEND_URL` = `https://codearena-elite.vercel.app` (your actual Vercel URL)
3. Click **"Save Changes"** — Render will redeploy automatically

---

## 🔑 Step 5: Create Admin Account

After deployment, register normally via the frontend, then promote yourself to admin via MongoDB Atlas:

1. Go to MongoDB Atlas → **Browse Collections** → `codearena` → `users`
2. Find your user document and edit: set `"role": "admin"`
3. Log out and back in — you'll now have access to `/admin`

---

## 🛠️ Local Development

```bash
# Clone the repo
git clone https://github.com/imshashvat/codearena-platform.git
cd codearena-platform

# Backend
cd code-evaluator-backend
cp .env.example .env     # Fill in your values
npm install
npm run dev              # Runs on http://localhost:5000

# Frontend (new terminal)
cd code-arena-elite
cp .env.example .env.local  # Optional, defaults to localhost:5000
npm install
npm run dev              # Runs on http://localhost:8080
```

---

## 📋 Environment Variables Reference

### Backend (`code-evaluator-backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 5000) |
| `MONGO_URI` | **Yes** | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Long random string for signing JWTs |
| `FRONTEND_URL` | Yes (prod) | Deployed frontend URL for CORS |

### Frontend (`code-arena-elite/.env.local`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes (prod) | Backend API URL (e.g., `https://...onrender.com/api`) |

---

## 🐳 Docker (Manual / Self-Hosted)

```bash
cd code-evaluator-backend
docker build -t codearena-backend .
docker run -p 5000:5000 \
  -e MONGO_URI="your_atlas_uri" \
  -e JWT_SECRET="your_secret" \
  -e FRONTEND_URL="https://your-frontend.vercel.app" \
  codearena-backend
```
