# CORS Fixes & Deployment Guide

## Problem
Getting 403 Preflight CORS errors on signup/login endpoints after deployment.

## Root Causes Fixed
1. ✅ CORS middleware was throwing errors instead of silently rejecting disallowed origins
2. ✅ Frontend didn't have proper API URL configuration for production
3. ✅ Error handler was incorrectly handling CORS rejections
4. ✅ Preflight OPTIONS requests were being blocked by database middleware

## Changes Made

### Backend (server.js)
- ✅ Improved CORS configuration with better error handling
- ✅ Changed CORS to use `callback(null, false)` instead of throwing errors
- ✅ Added logging to see which origins are being blocked
- ✅ Database middleware skips OPTIONS requests

### Frontend (App.jsx)
- ✅ Added dynamic API URL configuration for dev/prod
- ✅ Added request/response interceptors for debugging
- ✅ Proper axios credentials configuration

### Frontend (.env.production)
- ✅ Clear instructions for setting production backend URL

## Deployment Steps

### 1. Backend Deployment

#### Local Testing
```bash
cd backend
npm start
# Should show: "MongoDB Connected" and "Server running on port 5500"
```

#### Production Environment Variables
Set these on your deployment platform (Vercel, Heroku, Azure, etc.):

```env
PORT=5500
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=https://your-frontend-domain.com,https://your-app.com
NODE_ENV=production
```

**Important**: Set `CORS_ORIGIN` to your actual deployed frontend domain(s).

### 2. Frontend Deployment

#### Option A: Frontend & Backend on Same Domain
If both are hosted on the same domain (e.g., same server):

1. Build frontend:
```bash
cd frontend
npm run build
```

2. Deploy built `frontend/dist` folder to your web server
3. Leave `.env.production` empty or just set `VITE_API_URL=` (empty)
4. Frontend will automatically use `/api` which resolves to same domain

#### Option B: Frontend & Backend on Different Domains
If frontend and backend are on different domains:

1. Set `.env.production`:
```env
VITE_API_URL=https://your-api-domain.com
```

2. Build frontend:
```bash
cd frontend
npm run build
```

3. Deploy to your hosting (Vercel, Netlify, GitHub Pages, etc.)

4. Update backend's `CORS_ORIGIN` environment variable to include frontend domain

#### Option C: Using .env.production in Build Process
If deploying to Vercel/Netlify, they should automatically use `.env.production`:

1. Set environment variables in platform settings:
   - `VITE_API_URL=https://your-backend-domain.com`

2. Or add to `.env.production`:
```env
VITE_API_URL=https://your-backend-domain.com
```

3. Build command: `npm run build`

## Testing the Fixes

### Local Development
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
cd frontend && npm run dev

# Browser: http://localhost:5173
# Test signup - should work without CORS errors
```

### After Deployment

1. Open browser DevTools → Network tab
2. Go to signup page
3. Try to create account
4. Check network requests:
   - OPTIONS request should return 200 (not 403)
   - POST request should return 200 with response data

### Debug Logs

Check backend logs for:
```
Allowed Origins: [...]
Request: POST /api/auth/signup
```

Check frontend console (DevTools) for:
```
API URL configured to: https://your-backend-domain.com
Request: POST /api/auth/signup
```

## Common Issues & Solutions

### Still Getting 403 on Preflight?
1. **Check CORS_ORIGIN environment variable**
   ```bash
   # Backend should log: "Allowed Origins: [...]"
   # Make sure your frontend domain is in this list
   ```

2. **Verify frontend is sending from correct origin**
   ```javascript
   // In browser console:
   console.log(window.location.origin)
   // Should match one of the CORS_ORIGIN values
   ```

3. **Check if using proxy**
   - During `npm run dev`: Uses Vite proxy (should work)
   - After build: Proxy is gone, uses actual baseURL from .env.production

### Different Domain Showing Error?
1. Update backend's `CORS_ORIGIN` to include new frontend domain
2. Redeploy backend
3. Clear browser cache
4. Test again

### 403 But OPTIONS Request Shows Success?
1. Check if the actual POST request is coming from different origin
2. Ensure axios is using correct `withCredentials` setting
3. Verify all CORS headers are being sent

## Verification Checklist

- [ ] Backend `.env` has correct `CORS_ORIGIN`
- [ ] Frontend `.env.production` has correct `VITE_API_URL`
- [ ] Both frontend and backend are deployed
- [ ] Frontend domain is in backend's `CORS_ORIGIN` list
- [ ] Test signup creates account successfully
- [ ] No 403 errors in Network tab
- [ ] OPTIONS requests return 200
- [ ] POST requests return 200 with data

## Related Files Modified
- `backend/server.js` - CORS configuration
- `backend/middleware/db.js` - Skip OPTIONS requests
- `frontend/src/App.jsx` - Axios configuration
- `frontend/vite.config.js` - Build configuration
- `frontend/.env.production` - Production environment variables
