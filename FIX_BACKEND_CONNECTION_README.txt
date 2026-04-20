UPDATED FIXES

1. Frontend now tries these backend URLs automatically:
   - https://safeherlife-backend.onrender.com/api
   - https://safeherlife-backend.onrender.com/api
   - https://safeherlife-backend.onrender.com/api

2. Added safeherlife-api-base meta tag to index.html and staff.html.

3. Updated frontend .env and .env.example to safeherlife-backend.onrender.com/api.

4. Added render.yaml so Render can deploy backend from backend/ and frontend from frontend/.

Deploy backend service from backend/ with:
- Build Command: npm install
- Start Command: node server.js

Deploy frontend service from frontend/ as static site or use render.yaml.
