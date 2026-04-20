# SafeHerLife

SafeHerLife is a child abuse reporting platform with:

- frontend in `frontend/`
- backend in `backend/`

## Staff account rule

Staff accounts are **not** created from environment variables.
Each admin or social worker must create an account from `staff.html` and then sign in with that account.

## Local setup

### Backend env

Create `backend/.env` from `backend/.env.example` and fill in your real values:

```env
MONGODB_URI=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
COMMUNITY_RISK_FEATURE=true
INDIGENOUS_LANGUAGE_REPORTING=true
NODE_ENV=development
USE_FILE_DB=false
JWT_SECRET=replace_with_a_long_random_secret
```

### Frontend env

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
COMMUNITY_RISK_FEATURE=true
INDIGENOUS_LANGUAGE_REPORTING=true
```

### Install and run

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

Start backend:

```bash
npm --prefix backend run dev
```

Start frontend in a second terminal:

```bash
npm --prefix frontend run dev
```

## Important

- Do not put default staff usernames or passwords in env files.
- Staff create their own accounts from `frontend/staff.html`.
- Replace placeholder environment values before deploying.
