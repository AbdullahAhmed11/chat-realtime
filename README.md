Realtime Chat — Quick Start

Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

Backend (API)
1) Setup environment
   - Create `backend/.env`:
     - `PORT=4000`
     - `MONGODB_URI=mongodb://127.0.0.1:27017/realtime-chat` (or your Atlas URI)
     - `JWT_SECRET=<any-strong-secret>`
2) Install and run
   - `cd backend`
   - `npm install`
   - `npm run dev`
3) Health check
   - Open `http://localhost:4000`

MongoDB notes
- Local (macOS/Homebrew): `brew services start mongodb-community`
- Atlas: whitelist your IP and use the generated connection string

Frontend (Vite + React)
1) Set API URL
   - Create `frontend/.env` with `VITE_API_URL=http://localhost:4000`
2) Install and run
   - `cd frontend`
   - `npm install`
   - `npm run dev`
3) Open app
   - Visit `http://localhost:5173`

Common issues
- Database not connected: ensure MongoDB is running and `MONGODB_URI` is correct
- Auth errors: set `JWT_SECRET` in `backend/.env`

# chat-realtime
