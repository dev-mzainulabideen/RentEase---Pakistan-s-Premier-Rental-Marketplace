const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Required authentication middleware
const protect = async function(req, res, next) {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;

        if (!token) {
            return res.status(401).json({ status: 'error', message: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            console.error('Auth error: User not found for token ID:', decoded.id);
            return res.status(401).json({ status: 'error', message: 'Invalid token - user not found' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth middleware error:', err.message, err.name);
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ status: 'error', message: 'Invalid token format' });
        }
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ status: 'error', message: 'Token expired - please login again' });
        }
        return res.status(401).json({ status: 'error', message: 'Unauthorized' });
    }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async function(req, res, next) {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : null;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id).select('-password');
                if (user) {
                    req.user = user;
                }
            } catch (err) {
                // Token invalid or expired, but continue as guest
                req.user = null;
            }
        }
        
        next();
    } catch (err) {
        // Continue as guest on error
        req.user = null;
        next();
    }
};

module.exports = protect;
module.exports.protect = protect;
module.exports.optionalAuth = optionalAuth;

