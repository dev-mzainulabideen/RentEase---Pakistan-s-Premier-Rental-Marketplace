const ActivityLog = require('../models/ActivityLog');

// Activity logging middleware
const logActivity = async (req, action, entityType = null, entityId = null, description = '', metadata = {}) => {
    try {
        await ActivityLog.create({
            user: req.user?._id || null,
            action,
            entityType,
            entityId,
            description,
            metadata: {
                ...metadata,
                method: req.method,
                path: req.path
            },
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')
        });
    } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw error - logging should not break the request
    }
};

// Middleware factory for automatic logging
const createActivityLogger = (action, entityType = null, getDescription = null) => {
    return async (req, res, next) => {
        // Log after response is sent
        const originalSend = res.send;
        res.send = function(data) {
            res.send = originalSend;
            
            // Only log successful requests
            if (res.statusCode < 400) {
                const entityId = req.params.id || req.body.id || null;
                const description = getDescription 
                    ? getDescription(req, res) 
                    : `${action} performed on ${entityType || 'resource'}`;
                
                logActivity(req, action, entityType, entityId, description, {
                    statusCode: res.statusCode
                });
            }
            
            return originalSend.call(this, data);
        };
        
        next();
    };
};

// Manual logging helper
const logUserActivity = async (req, action, description, metadata = {}) => {
    await logActivity(req, action, 'user', req.user?._id, description, metadata);
};

module.exports = {
    logActivity,
    createActivityLogger,
    logUserActivity
};

