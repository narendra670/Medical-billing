const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const ensureDbConnected = require('./middleware/db');

const app = express();

app.set('trust proxy', 1);

const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:5500',
    'http://localhost:3000',
];

const allowedOriginPatterns = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

const allowedOrigins =
    allowedOriginPatterns.length > 0 ? allowedOriginPatterns : defaultOrigins;

const normalizeOrigin = (origin) => (origin ? origin.replace(/\/$/, '') : '');

const isOriginAllowed = (origin) => {
    if (!origin) return true;
    const normalized = normalizeOrigin(origin);
    return allowedOrigins.some((allowed) => {
        if (allowed.includes('*')) {
            const pattern =
                '^' +
                allowed
                    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
                    .replace(/\*/g, '.*') +
                '$';
            return new RegExp(pattern).test(normalized);
        }
        return normalized === allowed;
    });
};

console.log('Allowed Origins:', allowedOrigins);

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            console.log(`✅ CORS ALLOWED for origin: ${origin || 'no-origin'}`);
            callback(null, true);
        } else {
            console.warn(`❌ CORS BLOCKED for origin: ${origin}`);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'X-JSON-Response-Count'],
    optionsSuccessStatus: 200,
    maxAge: 3600
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Explicitly handle preflight requests
app.options('*', cors(corsOptions));
console.log('✅ CORS middleware initialized');

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.json({ ok: true, service: 'medical-store-api' });
});

app.get('/api/health', (req, res) => {
    res.json({ ok: true });
});

// Apply database middleware to all /api routes (skips OPTIONS requests internally)
app.use('/api', ensureDbConnected);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/invoices', require('./routes/invoice'));
app.use('/api/customers', require('./routes/customers'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.message);

    // Don't expose CORS errors as 403 - let CORS middleware handle it
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: 'Request origin not allowed' });
    }

    res.status(err.status || 500).json({
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
});

const PORT = process.env.PORT || 5500;

if (!process.env.VERCEL) {
    connectDB().then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }).catch((err) => {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    });
}

module.exports = app;