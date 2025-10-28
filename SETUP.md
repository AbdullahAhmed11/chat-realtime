# Setup Instructions

## Quick Start Guide

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)

### Backend Setup

1. Navigate to backend:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/realtime-chat
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=200
```

4. Start the server:
```bash
npm run dev
```

Backend runs on http://localhost:4000

### Frontend Setup

1. Navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:4000
```

4. Start the dev server:
```bash
npm run dev
```

Frontend runs on http://localhost:5173

## Testing the Application

1. Open http://localhost:5173 in your browser
2. Register a new account
3. Create a channel
4. Open the channel in a new tab to simulate multiple users
5. Send messages and see them appear in real-time across tabs!

## Production Build

### Frontend
```bash
cd frontend
npm run build
```
Output in `frontend/dist/`

### Backend
```bash
cd backend
npm start
```

## Notes

- Make sure MongoDB is running before starting the backend
- For production, change the JWT_SECRET to a secure random string
- Update CORS settings in backend/server.js for production deployment
- Consider using environment variables for different environments (dev, staging, prod)


