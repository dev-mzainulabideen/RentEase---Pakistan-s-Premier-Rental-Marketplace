'use strict';
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const connectDB = require('./config/database');
const { version, name } = require('./package.json');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration (development-friendly: allow all origins)
const corsOptions = {
    origin: true,
    credentials: true,
};

// Global middleware
app.use(cors(corsOptions));
app.use(helmet());

// Increase body size limits to allow listing payloads with images (base64/data URLs)
// Default is 100kb/1mb which is too small for multiple preview images.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(morgan('dev'));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // limit each IP to 300 requests per windowMs
});
app.use('/api', apiLimiter);

// Simple root route
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'My Rental Marketplace API',
        docs: {
            api: '/api',
            health: '/api/health',
            auth: '/api/auth',
            listings: '/api/listings',
        },
        service: name,
        version,
        time: new Date().toISOString(),
    });
});

// Routes
// API root info
app.get('/api', (req, res) => {
    res.json({
        status: 'ok',
        message: 'My Rental Marketplace API',
        docs: {
            health: '/api/health',
            auth: '/api/auth',
            listings: '/api/listings',
        },
        service: name,
        version,
        time: new Date().toISOString(),
    });
});
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/renter', require('./routes/renter'));
app.use('/api/owner', require('./routes/owner'));
app.use('/api/emergency-contacts', require('./routes/emergencyContacts'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/ad-display', require('./routes/adDisplay'));
app.use('/api/disputes', require('./routes/disputes'));
app.use('/api/safety-guidelines', require('./routes/safetyGuidelines'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/admin', require('./routes/admin'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(err.status || 500).json({
        status: 'error',
        message: err.message || 'Internal Server Error',
    });
});

// Start server
(async () => {
    try {
        await connectDB();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error(' Failed to start server:', error.message);
        process.exit(1);
    }
})();

