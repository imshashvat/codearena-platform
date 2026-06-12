# 🏆 CodeArena Elite — Deployment Guide

A full-stack competitive coding platform with real-time code evaluation, contests, and proctoring.

## Tech Stack
- **Frontend:** Vite + React + TypeScript → deployed to **Vercel**
- **Backend:** Node.js + Express + MongoDB → deployed to **Railway (Docker)**
- **Database:** MongoDB Atlas (free tier)
- **Code Judge:** Built-in multi-language runner (Python3, C, C++, Java, JavaScript)

---

## 🗄️ Step 1: Set Up MongoDB Atlas

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and sign up / log in
2. Click **"Build a Database"** → choose **Free (M0)**
3. Choose a cloud provider (AWS) and region closest to you
4. Set a **Username** and **Password** (save these!)
5. Under **"Network Access"** → **"Add IP Address"** → click **"Allow Access from Anywhere"** (`0.0.0.0/0`)
6. Click **"Connect"** on your cluster → **"Drivers"** → copy the connection string

Your connection string looks like:
```
mongodb+srv://admin:yourpassword@cluster0.abc12.mongodb.net/codearena?retryWrites=true&w=majority
```
Replace `<password>` with your actual password.

---

## 🚂 Step 2: Deploy Backend to Railway

1. Go to [https://railway.app](https://railway.app) and sign up / log in with **GitHub**
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `imshashvat/codearena-platform`
4. Railway will detect the project. Click **"Add service"** → select **GitHub Repo** again if needed
5. In the service settings, set the **Root Directory** to:
   ```
   code-evaluator-backend
   ```
   Railway will automatically use the `Dockerfile` in that directory.

6. Go to the **"Variables"** tab and add these environment variables:

   | Variable | Value |
   |----------|-------|
   | `MONGO_URI` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | A long random string (generate below) |
   | `FRONTEND_URL` | *(leave blank for now — add after Step 3)* |

   **Generate a secure JWT secret** (run this in any terminal):
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

7. Go to **"Settings"** → under **"Networking"** → click **"Generate Domain"**
8. Railway will build the Docker image and deploy (~3-5 minutes)
9. Your backend URL will be something like: `https://codearena-backend-production.up.railway.app`

> **Note:** Railway's free Hobby tier gives you $5/month free credits — more than enough for a small project.

---

## 🌐 Step 3: Deploy Frontend to Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign up / log in with **GitHub**
2. Click **"Add New Project"** → Import `imshashvat/codearena-platform`
3. Configure the project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `code-arena-elite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Under **Environment Variables**, add:

   | Variable | Value |
   |----------|-------|
   | `VITE_API_URL` | `https://your-railway-backend-url.up.railway.app/api` |

5. Click **"Deploy"**
6. Your frontend URL will be: `https://codearena-elite.vercel.app` (or similar)

---

## 🔗 Step 4: Connect Frontend ↔ Backend (CORS)

After both are deployed:

1. Go to **Railway** → your backend service → **"Variables"** tab
2. Add/update:
   ```
   FRONTEND_URL = https://codearena-elite.vercel.app
   ```
   (use your actual Vercel URL)
3. Railway will **automatically redeploy** with the new variable

---

## 👑 Step 5: Create Admin Account

After deployment, register an account via the frontend, then:

1. Open **MongoDB Atlas** → Browse Collections → `codearena` → `users`
2. Find your user document → click **Edit** → set `"role": "admin"`
3. Log out and back in — you'll have access to the `/admin` panel

---

## 🛠️ Local Development

```bash
# Clone the repo
git clone https://github.com/imshashvat/codearena-platform.git
cd codearena-platform

# Backend
cd code-evaluator-backend
cp .env.example .env        # Fill in your values
npm install
npm run dev                 # Runs on http://localhost:5000

# Frontend (new terminal)
cd ../code-arena-elite
cp .env.example .env.local  # Optional — defaults to localhost:5000
npm install
npm run dev                 # Runs on http://localhost:8080
```

---

## 📋 Environment Variables Reference

### Backend (`code-evaluator-backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port — Railway sets this automatically |
| `MONGO_URI` | **Yes** | MongoDB Atlas connection string |
| `JWT_SECRET` | **Yes** | Long random string for signing JWTs |
| `FRONTEND_URL` | Yes (prod) | Deployed Vercel frontend URL for CORS |

### Frontend (`code-arena-elite/.env.local`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes (prod) | Railway backend API URL ending in `/api` |

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
