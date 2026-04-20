# Safeherlife

Safeherlife is a two-part project:

- `index.html` is the public client-approved user app.
- `staff-portal.html` is the separate web portal for Admin and Social Worker access.
- `backend/` is the Node/Express API for case submission, tracking, and staff login.

## Public app behavior

- The calculator screen is the home screen.
- A user creates a 4-digit PIN from the calculator screen.
- Entering the saved PIN and pressing `=` unlocks the icons page.
- Public navigation items stay hidden until the icons page is unlocked.
- Admin and Social Worker access stay outside the public page.

## Project structure

- `index.html` — public user interface
- `staff-portal.html` — separate staff portal
- `backend/` — API server
- `src/` — legacy React source kept in the project

## Run locally

### 1) Backend

```powershell
cd C:\Users\USER\SafeVoice\backend
npm install
npm run dev
```

The backend runs on `http://localhost:5000`.

### 2) Public app

Open `index.html` in your browser.

### 3) Staff portal

Open `staff-portal.html` in your browser.

## Environment file

Create `backend/.env` from `backend/.env.example`.

### MongoDB mode

```env
MONGODB_URI=mongodb+srv://OyoTechHub:GkfqfFNaPEaqyYln@cluster0.nzs7yju.mongodb.net/?appName=Cluster0
CLIENT_URL=https://safeherlife-frontend.onrender.com
FRONTEND_URL=https://safeherlife-frontend.onrender.com
CORS_ORIGINS=https://safeherlife-frontend.onrender.com
OPENAI_API_KEY=your_real_openai_api_key
OPENAI_TRANSLATION_MODEL=gpt-5-mini
COMMUNITY_RISK_FEATURE=true
INDIGENOUS_LANGUAGE_REPORTING=true
NODE_ENV=production
USE_FILE_DB=false
```

### Local fallback mode

```env
PORT=5000
CLIENT_URL=http://localhost:5173
USE_FILE_DB=true
```

## Push to GitHub

```powershell
cd C:\Users\USER\Safeherlife
git init
git branch -M main
git add .
git commit -m "Update Safeherlife calculator home and PIN unlock flow"
git remote add origin  https://github.com/austine77/safeherlife.git
git push -u origin main
```

If `origin` already exists:

```powershell
git remote set-url origin https://github.com/austine77/safeherlife.git
git push -u origin main
```
