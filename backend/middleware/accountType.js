const AccountService = require('../services/accountService');

/**
 * Middleware to check if user has required account type
 * @param {String|Array} requiredTypes - Required account type(s)
 * @returns {Function} Express middleware
 */
const requireAccountType = (requiredTypes) => {
    const types = Array.isArray(requiredTypes) ? requiredTypes : [requiredTypes];
    
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user._id) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Authentication required'
                });
            }
            
            const accountService = new AccountService();
            const accountInfo = await accountService.getAccountInfo(req.user._id);
            
            if (!types.includes(accountInfo.accountType)) {
                return res.status(403).json({
                    status: 'error',
                    message: `This action requires a ${types.join(' or ')} account`,
                    accountType: accountInfo.accountType,
                    requiredTypes: types
                });
            }
            
            // Attach account info to request
            req.accountInfo = accountInfo;
            next();
        } catch (error) {
            console.error('Account type check error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to verify account type'
            });
        }
    };
};

/**
 * Middleware to check if user has a specific feature
 * @param {String} feature - Feature name
 * @returns {Function} Express middleware
 */
const requireFeature = (feature) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user._id) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Authentication required'
                });
            }
            
            const accountService = new AccountService();
            const hasFeature = await accountService.hasFeature(req.user._id, feature);
            
            if (!hasFeature) {
                const accountInfo = await accountService.getAccountInfo(req.user._id);
                return res.status(403).json({
                    status: 'error',
                    message: `This feature is not available for ${accountInfo.accountType} accounts`,
                    accountType: accountInfo.accountType,
                    feature: feature
                });
            }
            
            // Attach account info to request
            req.accountInfo = await accountService.getAccountInfo(req.user._id);
            next();
        } catch (error) {
            console.error('Feature check error:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Failed to verify feature access'
            });
        }
    };
};

/**
 * Middleware to attach account info to request (non-blocking)
 */
const attachAccountInfo = async (req, res, next) => {
    try {
        if (req.user && req.user._id) {
            const accountService = new AccountService();
            req.accountInfo = await accountService.getAccountInfo(req.user._id);
        }
        next();
    } catch (error) {
        console.error('Error attaching account info:', error);
        // Don't block request, just continue without account info
        next();
    }
};

module.exports = {
    requireAccountType,
    requireFeature,
    attachAccountInfo
};

