const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');
const ensureDbConnected = require('./middleware/db');

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:5500', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
}));

// Handle preflight requests explicitly
app.options('*', cors());

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

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ message: 'CORS not allowed' });
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