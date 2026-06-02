# 🔧 CORS Error Fix for Deployment - Step-by-Step Guide

## ⚠️ Problem
CORS errors occur on **login/signup after deployment** because the backend doesn't know which frontend domain to allow.

---

## ✅ Solution: Set Environment Variables

### Step 1: Deploy Backend & Get URL
First, deploy your backend and note its URL:
- **Example**: `https://your-backend.herokuapp.com` or `https://medicalstore-api.vercel.app`

### Step 2: Deploy Frontend & Get URL  
Deploy your frontend and note its URL:
- **Example**: `https://your-frontend.vercel.app` or `https://medicalstore.netlify.app`

### Step 3: Configure Backend Environment Variables

Go to your **backend deployment platform** (Vercel, Heroku, Railway, etc.) and set these environment variables:

```env
# CRITICAL FOR CORS - Add your FRONTEND URL here!
CORS_ORIGIN=https://your-frontend.vercel.app

# Other required variables
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=production
PORT=3000
```

> **Multiple domains?** Separate with commas:
> ```
> CORS_ORIGIN=https://your-frontend.vercel.app,https://alternate-domain.com,https://mobile-app.example.com
> ```

### Step 4: Configure Frontend Environment (if needed)

**Option A: Same Domain (Recommended)**
- Frontend and backend on same domain: `https://yourdomain.com`
- Backend: `https://yourdomain.com/api` 
- Leave `VITE_API_URL=` empty (already done ✓)

**Option B: Different Domains**
- Frontend: `https://your-frontend.vercel.app`
- Backend: `https://your-backend.herokuapp.com`
- Set in `frontend/.env.production`:
  ```env
  VITE_API_URL=https://your-backend.herokuapp.com
  ```

---

## 🧪 Test After Deployment

1. **Go to your deployed frontend**: `https://your-frontend.vercel.app`
2. **Open Browser DevTools** (F12)
3. **Try Login/Signup**
4. **Check Console** for:
   - ❌ **CORS error** = Missing/wrong `CORS_ORIGIN`
   - ✅ **No CORS error** = Configured correctly!
   - ✅ **200 response** = Success!

### Example Console Output (✅ Correct)
```
API URL configured to: https://your-backend.herokuapp.com
Request: POST /api/auth/login
```

---

## 🚀 Platform-Specific Setup

### Vercel Backend
1. Go to: **Settings → Environment Variables**
2. Add new variable:
   - **Name**: `CORS_ORIGIN`
   - **Value**: Your frontend URL
   - **Environments**: Select `Production`, `Preview`, `Development`
3. Click **Add**
4. Redeploy (automatic or manual)

### Vercel Frontend
1. `frontend/.env.production` is already configured
2. It will automatically use your backend URL from `VITE_API_URL`

### Heroku
```bash
# Set environment variable via CLI
heroku config:set CORS_ORIGIN=https://your-frontend.vercel.app --app your-backend-app
```

### Railway
1. Go to **Your Project → Variables**
2. Add new variable: `CORS_ORIGIN=https://your-frontend.vercel.app`
3. Deploy

### Render
1. Go to **Environment → Environment Variables**
2. Add: `CORS_ORIGIN=https://your-frontend.vercel.app`
3. Deploy

---

## 🐛 Troubleshooting

### "CORS blocked" on login
**Cause**: `CORS_ORIGIN` not set or wrong domain
**Fix**: Double-check that:
- ✅ Backend env var is set correctly
- ✅ Frontend URL is exact match (including `https://` or `http://`)
- ✅ No trailing slash: `https://example.com` NOT `https://example.com/`

### "API request returns 500"
**Cause**: Backend is running but can't reach MongoDB
**Fix**: Verify:
- ✅ `MONGO_URI` is set correctly
- ✅ Your IP is whitelisted in MongoDB Atlas (if using cloud)
- ✅ Database name is correct

### "Login works locally but not after deployment"
**Cause**: Hardcoded localhost URL somewhere
**Fix**: 
- ✅ Check that `VITE_API_URL` is NOT set to `localhost`
- ✅ Verify backend is deployed and running
- ✅ Check browser console for actual error message

---

## ✅ Quick Checklist Before Going Live

- [ ] Backend deployed to: `_______________________`
- [ ] Frontend deployed to: `_______________________`
- [ ] Backend env var `CORS_ORIGIN` set to frontend URL
- [ ] Backend env var `MONGO_URI` set to database URL
- [ ] Backend env var `JWT_SECRET` set
- [ ] Frontend `VITE_API_URL` set (if different domain)
- [ ] Login endpoint responds with 200 (not 403)
- [ ] No CORS errors in browser console
- [ ] Token is stored in localStorage
- [ ] Can navigate to protected pages

---

## 📝 Current Configuration Status

### Backend (server.js)
✅ CORS middleware properly configured
✅ Allows `credentials: true`
✅ Explicit preflight handling (`app.options('*', cors(...))`)
✅ Reads allowed origins from `CORS_ORIGIN` env var

### Middleware (db.js)
✅ Skips OPTIONS (preflight) requests
✅ Only connects DB for actual requests

### Frontend (App.jsx)
✅ Automatically configures API URL
✅ Uses `VITE_API_URL` for production
✅ Falls back to `window.location.origin` if not set
✅ Sets `withCredentials: true` for cookies

### Frontend (.env.production)
✅ File exists and ready
✅ `VITE_API_URL=` (currently empty - will use same origin)

---

## 🎯 Next Steps

1. **Deploy backend** (if not already done)
2. **Set `CORS_ORIGIN` env var** on backend deployment platform
3. **Deploy frontend** 
4. **Test login** on deployed site
5. **Check console** for any errors
6. If still getting CORS error, share the exact error message

**Good luck! 🚀**
