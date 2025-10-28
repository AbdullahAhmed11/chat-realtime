# Quick Start Guide

## Prerequisites
- Node.js installed
- MongoDB running (local or MongoDB Atlas)

## One-Time Setup

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/realtime-chat
JWT_SECRET=change-this-secret-key-in-production
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=200
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:4000
```

## Running the Application

### Terminal 1: Backend
```bash
cd backend
npm run dev
```
✅ Server runs on http://localhost:4000

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```
✅ App runs on http://localhost:5173

## First Use

1. Open http://localhost:5173
2. Click "Sign up" to create an account
3. Log in with your credentials
4. Create a channel or join an existing one
5. Start chatting!

## Testing Real-Time Features

1. Open the app in multiple browser tabs
2. Join the same channel in each tab
3. Send messages from one tab
4. Watch them appear instantly in other tabs
5. Notice join/leave notifications when switching tabs

## Troubleshooting

**Port already in use?**
- Change PORT in backend/.env
- Update VITE_API_URL in frontend/.env to match

**MongoDB connection failed?**
- Ensure MongoDB is running: `mongod`
- Or use MongoDB Atlas connection string

**Can't connect to backend?**
- Check backend server is running on port 4000
- Verify VITE_API_URL matches backend port
- Check browser console for CORS errors

## Next Steps

- Customize the UI colors and branding
- Add more features (see PROJECT_SUMMARY.md)
- Deploy to production
- Configure environment-specific settings

## File Locations

- Backend entry: `backend/server.js`
- Frontend entry: `frontend/src/main.jsx`
- API routes: `backend/routes/`
- React pages: `frontend/src/pages/`
- Components: `frontend/src/components/`


