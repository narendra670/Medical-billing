const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const ensureDbConnected = require('./middleware/db');

const app = express();

// Get allowed origins from environment or use defaults
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:5500', 'http://localhost:3000'];

console.log('Allowed Origins:', allowedOrigins);

// CORS configuration
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked for origin: ${origin}`);
            // Don't throw error, just silently reject for preflight
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