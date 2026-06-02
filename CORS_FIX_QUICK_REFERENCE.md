# CORS Fix - Key Changes Quick Reference

## Backend Changes

### 1. server.js - CORS Configuration
**Before**:
```javascript
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));  // ❌ Throws error
        }
    }
}));
```

**After**:
```javascript
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, false);  // ✅ Silently rejects
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200,  // ✅ Proper preflight response
    maxAge: 3600
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));  // ✅ Explicit preflight handler
console.log('Allowed Origins:', allowedOrigins);  // ✅ Debug logging
```

### 2. middleware/db.js - Skip OPTIONS
**Before**:
```javascript
const ensureDbConnected = async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        // handles error
    }
};
```

**After**:
```javascript
const ensureDbConnected = async (req, res, next) => {
    if (req.method === 'OPTIONS') {  // ✅ Skip preflight
        return next();
    }
    try {
        await connectDB();
        next();
    } catch (err) {
        // handles error
    }
};
```

## Frontend Changes

### 1. App.jsx - Dynamic API URL
**Before**:
```javascript
if (import.meta.env.PROD) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';
}
```

**After**:
```javascript
const configureAxios = () => {
  let apiURL;
  
  if (import.meta.env.PROD) {
    apiURL = import.meta.env.VITE_API_URL || window.location.origin;
  } else {
    apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5500';
  }
  
  console.log('API URL configured to:', apiURL);
  
  axios.defaults.baseURL = apiURL;
  axios.defaults.withCredentials = true;
  
  // ✅ Request/response interceptors for debugging
  axios.interceptors.request.use((config) => {
    console.log('Request:', config.method.toUpperCase(), config.url);
    return config;
  });
  
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('Response error:', error.response?.status, error.message);
      return Promise.reject(error);
    }
  );
};

configureAxios();
```

### 2. .env.production - Clear Instructions
```env
# Production backend URL - Set this to your deployed backend URL
# Examples:
# VITE_API_URL=https://api.yourdomain.com
# VITE_API_URL=https://backend-service.herokuapp.com

# If not set, defaults to window.location.origin
VITE_API_URL=
```

## Environment Variables to Set

### Backend (.env)
```env
PORT=5500
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=http://localhost:5173,http://localhost:5500,http://localhost:3000
NODE_ENV=development
```

### Backend Production (.env on hosting platform)
```env
PORT=5500
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=https://your-frontend-domain.com
NODE_ENV=production
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5500
```

### Frontend Production (.env.production)
```env
VITE_API_URL=https://your-backend-domain.com
# OR leave empty to use same domain
VITE_API_URL=
```

## Testing Commands

```bash
# Local Development
cd backend && npm start
cd frontend && npm run dev

# Production Build
cd frontend && npm run build

# Check built files
ls frontend/dist/
```

## Expected Behavior

✅ **With These Fixes**:
- Browser sends OPTIONS → Server responds 200 (no 403)
- Browser sends POST → Server responds with data
- No CORS errors in console
- Signup/Login work correctly
- Both dev and production environments work

❌ **Without These Fixes**:
- OPTIONS request returns 403
- Browser blocks POST request
- CORS error in console
- Signup/Login fail silently

## Debug Logs to Look For

**Backend Console**:
```
Allowed Origins: [
  'http://localhost:5173',
  'http://localhost:5500',
  'http://localhost:3000'
]
MongoDB Connected
Server running on port 5500
POST /api/auth/signup
```

**Frontend Console**:
```
API URL configured to: http://localhost:5500
Request: POST /api/auth/signup
```

**Browser Network Tab**:
- OPTIONS request: ✅ Status 200
- Response headers: `Access-Control-Allow-Origin: http://localhost:5173`
- POST request: ✅ Status 200
- Response body: User data
