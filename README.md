# 🏥 MedSimplify

> AI-powered medical report simplifier — converts jargon into plain language.

---

## 🚀 Run Locally (2 minutes)

### Prerequisites
- Node.js 18+
- Python 3.9+

### Option A — One command
```bash
chmod +x start.sh
./start.sh
```
Open http://localhost:5173

### Option B — Manual

**Terminal 1 – Backend**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 2 – Frontend**
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

---

## 🌐 Deploy to Production (Free)

### Backend → Render.com (free tier)
1. Push this repo to GitHub/GitLab
2. Go to https://render.com → New Web Service
3. Connect your repo → select `backend/` as root
4. Set:
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Deploy → copy your URL e.g. `https://medsimplify-api.onrender.com`

### Frontend → Vercel (free tier)
1. Go to https://vercel.com → New Project → import your repo
2. Set root directory to `frontend/`
3. Add environment variable:
   - `VITE_API_URL` = your Render backend URL
4. In `frontend/src/App.jsx`, change the fetch line to:
   ```js
   const res = await fetch(`${import.meta.env.VITE_API_URL}/analyze`, { ... })
   ```
5. Deploy!

---

## ✨ Features
- 📋 Upload PDF, image, or paste report text
- 🟢🟡🔴 Color-coded findings (Normal / Monitor / See Doctor)
- 🧒 "Explain like I'm 10" mode
- 🩺 Doctor Visit Summary with questions to ask
- 🌐 6 Indian languages (Hindi, Marathi, Tamil, Telugu, Kannada)
- ⚠️ Ethical disclaimer on every result

## 🛠 Tech Stack
- **Frontend**: React + Vite
- **Backend**: Python FastAPI
- **AI**: Groq API (llama3-70b — free & fast)

## ⚠️ Disclaimer
MedSimplify helps you understand reports but does not diagnose diseases
or replace professional medical advice. Always consult a qualified doctor.
