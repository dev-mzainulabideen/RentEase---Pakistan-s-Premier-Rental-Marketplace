const protect = require('./auth').protect;

// Admin-only middleware
const requireAdmin = (req, res, next) => {
    // First check authentication
    protect(req, res, (err) => {
        if (err) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Authentication required' 
            });
        }

        // Then check admin role
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ 
                status: 'error', 
                message: 'Admin access required' 
            });
        }

        next();
    });
};

module.exports = requireAdmin;

