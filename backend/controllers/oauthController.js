const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Build user response
async function buildUserResponse(userDoc) {
    const user = userDoc.toObject();
    delete user.password;
    return {
        ...user,
        accountType: user.accountType || 'free',
        isVerified: !!user.verified,
        verificationStatus: user.verification?.status || 'not_verified'
    };
}

// Google OAuth callback
exports.googleCallback = async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login.html?error=oauth_failed`);
        }

        // Exchange code for tokens
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:4001'}/api/auth/google/callback`,
            grant_type: 'authorization_code'
        });

        const { access_token } = tokenResponse.data;

        // Get user info from Google
        const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        const { id: googleId, email, name, picture } = userInfoResponse.data;

        // Find or create user
        let user = await User.findOne({ 
            $or: [
                { email: email.toLowerCase() },
                { 'oauth.googleId': googleId }
            ]
        });

        if (user) {
            // Update OAuth info if not present
            if (!user.oauth) user.oauth = {};
            user.oauth.googleId = googleId;
            if (picture) user.avatar = picture;
            await user.save();
        } else {
            // Create new user
            user = await User.create({
                email: email.toLowerCase(),
                name: name || 'Google User',
                avatar: picture || null,
                password: require('crypto').randomBytes(32).toString('hex'), // Random password
                role: 'renter',
                accountType: 'free',
                verified: true, // OAuth users are pre-verified
                verificationStatus: {
                    email: true,
                    phone: false,
                    id: false,
                    biometric: false,
                    face: false
                },
                oauth: {
                    googleId: googleId,
                    provider: 'google'
                }
            });
        }

        // Generate JWT token
        const token = signToken(user._id);
        const userResponse = await buildUserResponse(user);

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/oauth-callback.html?token=${token}&user=${encodeURIComponent(JSON.stringify(userResponse))}`);
    } catch (error) {
        console.error('Google OAuth error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/login.html?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
    }
};

// Facebook OAuth callback
exports.facebookCallback = async (req, res) => {
    try {
        const { code } = req.query;
        
        if (!code) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login.html?error=oauth_failed`);
        }

        // Exchange code for access token
        const tokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
            params: {
                client_id: process.env.FACEBOOK_APP_ID,
                client_secret: process.env.FACEBOOK_APP_SECRET,
                redirect_uri: `${process.env.BACKEND_URL || 'http://localhost:4001'}/api/auth/facebook/callback`,
                code
            }
        });

        const { access_token } = tokenResponse.data;

        // Get user info from Facebook
        const userInfoResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
            params: {
                fields: 'id,name,email,picture',
                access_token
            }
        });

        const { id: facebookId, email, name, picture } = userInfoResponse.data;
        const avatarUrl = picture?.data?.url || null;

        // Find or create user
        let user = await User.findOne({ 
            $or: [
                { email: email?.toLowerCase() },
                { 'oauth.facebookId': facebookId }
            ]
        });

        if (user) {
            // Update OAuth info if not present
            if (!user.oauth) user.oauth = {};
            user.oauth.facebookId = facebookId;
            if (avatarUrl) user.avatar = avatarUrl;
            await user.save();
        } else {
            // Create new user
            user = await User.create({
                email: email?.toLowerCase() || `facebook_${facebookId}@facebook.com`,
                name: name || 'Facebook User',
                avatar: avatarUrl,
                password: require('crypto').randomBytes(32).toString('hex'), // Random password
                role: 'renter',
                accountType: 'free',
                verified: true, // OAuth users are pre-verified
                verificationStatus: {
                    email: !!email,
                    phone: false,
                    id: false,
                    biometric: false,
                    face: false
                },
                oauth: {
                    facebookId: facebookId,
                    provider: 'facebook'
                }
            });
        }

        // Generate JWT token
        const token = signToken(user._id);
        const userResponse = await buildUserResponse(user);

        // Redirect to frontend with token
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/oauth-callback.html?token=${token}&user=${encodeURIComponent(JSON.stringify(userResponse))}`);
    } catch (error) {
        console.error('Facebook OAuth error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/login.html?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
    }
};

// Initiate Google OAuth
exports.googleAuth = (req, res) => {
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:4001'}/api/auth/google/callback`;
    const scope = 'profile email';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;
    res.redirect(authUrl);
};

// Initiate Facebook OAuth
exports.facebookAuth = (req, res) => {
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:4001'}/api/auth/facebook/callback`;
    const scope = 'email,public_profile';
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=code`;
    res.redirect(authUrl);
};

