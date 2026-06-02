# 📋 CORS FIX - DEPLOYMENT QUICK CHECKLIST

## 🔴 BEFORE: CORS Error on Login After Deployment
```
POST /api/auth/login 403 (Forbidden)
CORS error
```

## 🟢 AFTER: Fix Applied

### Step 1: Backend Environment Variables
```
✅ CORS_ORIGIN = https://your-frontend-url.com
✅ MONGO_URI = your_database_url
✅ JWT_SECRET = your_secret_key
✅ NODE_ENV = production
```

### Step 2: Test Login
```
✅ No CORS errors in browser console
✅ Login request returns 200
✅ Token stored in localStorage
✅ Redirected to dashboard
```

---

## 🎯 THE CRITICAL FIX

**Backend needs to KNOW which frontend domain is allowed:**

| Platform | How to Set Environment Variable |
|----------|------|
| **Vercel** | Settings → Environment Variables → Add `CORS_ORIGIN` |
| **Heroku** | `heroku config:set CORS_ORIGIN=...` |
| **Railway** | Project → Variables → Add new variable |
| **Render** | Environment → Environment Variables → Add new |
| **Others** | Admin panel → Environment/Variables section |

---

## ✅ WHAT TO SET

```
CORS_ORIGIN = https://your-frontend-domain.com
```

**Examples:**
- `https://medicalstore.vercel.app`
- `https://medicalstore.netlify.app`
- `https://yourdomain.com`
- `https://app.yourdomain.com` (subdomain)

**Multiple domains:**
```
https://site1.com,https://site2.com,https://site3.com
```

---

## 🚀 DEPLOY ORDER

1. **Deploy Backend** → Note the URL
2. **Set `CORS_ORIGIN`** on backend platform
3. **Deploy Frontend**
4. **Test Login** → Should work! ✅

---

## 🐛 IF STILL NOT WORKING

Check:
- [ ] `CORS_ORIGIN` is set (not empty)
- [ ] Backend is actually redeployed (sometimes need manual trigger)
- [ ] Frontend URL is EXACTLY correct (check for typos)
- [ ] No trailing slash: ✅ `https://example.com` ❌ `https://example.com/`
- [ ] Browser DevTools Console shows no CORS error

---

## 💡 CURRENT CODE STATUS

All code is already configured! You just need to:

**Backend**: ✅ Ready (waits for env var)
- Checks `CORS_ORIGIN` from environment
- Allows that domain + credentials
- Handles preflight requests

**Frontend**: ✅ Ready (works with any backend)
- Auto-detects API URL
- Sets credentials for cookies
- Falls back to same origin if not configured

**Database**: ✅ Ready (connected)
- JWT authentication working
- MongoDB connection ready

**Only missing**: Set the `CORS_ORIGIN` env var on your deployment platform!

---

*Modified: June 2, 2026*
