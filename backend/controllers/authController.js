const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Verification = require('../models/Verification');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Normalize incoming role values to match User.role enum
function normalizeRole(role) {
    if (!role) return 'renter';
    const value = String(role).toLowerCase();
    if (value === 'dual' || value === 'dual_role' || value === 'both') return 'dual_role';
    if (value === 'owner' || value === 'rent_out') return 'owner';
    if (value === 'renter' || value === 'rent_items') return 'renter';
    if (value === 'admin') return 'admin';
    if (value === 'moderator' || value === 'modrater') return 'moderator';
    return 'renter';
}

// Helpers for verification
const signEmailVerificationToken = (userId) =>
    jwt.sign({ id: userId, purpose: 'verify_email' }, process.env.JWT_SECRET, { expiresIn: '24h' });

const createOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Build a safe user response with extra flags
async function buildUserResponse(userDoc, includeStats = false) {
    const user = userDoc.toObject();
    delete user.password;
    
    // Get subscription status for accurate account info
    let subscriptionActive = false;
    if (user.accountType === 'paid' && user.subscription?.status === 'active') {
        const now = new Date();
        if (user.subscription.endDate && new Date(user.subscription.endDate) > now) {
            subscriptionActive = true;
        }
    }
    
    const response = {
        ...user,
        accountType: user.accountType || 'free', // Ensure accountType is always present
        isPaid: user.accountType === 'paid' && subscriptionActive,
        isVerified: !!user.verified,
        subscriptionActive: subscriptionActive,
        verificationStatus: user.verification?.status || 'not_verified'
    };

    // Include stats if requested (for profile/me endpoints)
    if (includeStats) {
        try {
            const Booking = require('../models/Booking');
            const Listing = require('../models/Listing');
            const Review = require('../models/Review');

            const [bookingsCount, listingsCount, reviewsCount] = await Promise.all([
                Booking.countDocuments({ renter: userDoc._id }),
                Listing.countDocuments({ owner: userDoc._id }),
                Review.countDocuments({ reviewee: userDoc._id }),
            ]);

            // Calculate average rating from reviews
            const reviews = await Review.find({ reviewee: userDoc._id }).select('rating');
            const averageRating = reviews.length > 0
                ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
                : 0;

            response.stats = {
                totalBookings: bookingsCount,
                totalListings: listingsCount,
                totalReviews: reviewsCount,
                averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
            };
        } catch (err) {
            console.warn('Failed to load user stats:', err.message);
            response.stats = {
                totalBookings: 0,
                totalListings: 0,
                totalReviews: 0,
                averageRating: 0,
            };
        }
    }

    return response;
}

// POST /api/auth/register
// Fields: name, email, mobile, password, confirmPassword, role
exports.register = async (req, res) => {
    try {
        const {
            name,
            email,
            mobile,
            phone, // support both mobile and phone
            password,
            confirmPassword,
            role,
        } = req.body;

        const errors = [];

        const nameValue = (name || '').trim();
        const emailValue = (email || '').trim();
        const mobileValue = (mobile || phone || '').trim();

        if (!nameValue) errors.push('Name is required');
        if (!emailValue) errors.push('Email is required');
        // Mobile is optional, but if provided it must be valid
        if (!password) errors.push('Password is required');
        if (!confirmPassword) errors.push('Confirm password is required');

        if (password && password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        if (password && confirmPassword && password !== confirmPassword) {
            errors.push('Password and confirm password do not match');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailValue && !emailRegex.test(emailValue)) {
            errors.push('Please enter a valid email address');
        }

        const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
        if (mobileValue) {
            const cleaned = mobileValue.replace(/[\s-]/g, '');
            if (!phoneRegex.test(cleaned)) {
                errors.push('Please enter a valid Pakistani mobile number');
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Validation failed', errors });
        }

        const normalizedPhone = mobileValue ? mobileValue.replace(/[\s-]/g, '') : '';
        const normalizedRole = normalizeRole(role);

        const query = [{ email: emailValue.toLowerCase() }];
        if (normalizedPhone) {
            query.push({ phone: normalizedPhone });
        }

        const existing = await User.findOne({ $or: query });
        if (existing) {
            return res
                .status(400)
                .json({ status: 'error', message: 'User with this email or mobile already exists' });
        }

        console.log('📝 Creating user:', emailValue.toLowerCase(), '| Role:', normalizedRole);
        // SECURITY: Always create as 'free' account, ignore any accountType from request
        const user = await User.create({
            name: nameValue,
            email: emailValue.toLowerCase(),
            phone: normalizedPhone || undefined,
            password,
            role: normalizedRole,
            accountType: 'free', // Always free on registration, cannot be changed via registration
        });

        console.log('✅ User created successfully:', user.email, '| ID:', user._id);
        const token = signToken(user._id);
        const safeUser = await buildUserResponse(user, false); // Don't include stats on registration

        return res.status(201).json({
            status: 'success',
            token,
            user: safeUser,
            message: 'Account created. Please verify your email/phone.',
        });
    } catch (err) {
        console.error('Register error:', err);

        // Handle duplicate key errors (e.g. email or phone already exists, including legacy phone:null index)
        if (err && err.code === 11000) {
            const field = err.keyPattern && Object.keys(err.keyPattern)[0];
            let message = 'User with this email or mobile already exists';
            if (field === 'email') {
                message = 'User with this email already exists';
            } else if (field === 'phone') {
                message = 'User with this mobile number already exists';
            }
            return res.status(400).json({ status: 'error', message });
        }

        return res.status(500).json({ status: 'error', message: 'Registration failed' });
    }
};

// POST /api/auth/login
// Fields: email or phone (identifier), password
exports.login = async (req, res) => {
    try {
        const { email, identifier, password } = req.body;

        const rawIdentifier = (identifier || email || '').trim();

        if (!rawIdentifier || !password) {
            return res
                .status(400)
                .json({ status: 'error', message: 'Email/phone and password are required' });
        }

        // Decide whether identifier is email or phone
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let userQuery = null;

        if (emailRegex.test(rawIdentifier)) {
            // Treat as email login
            userQuery = { email: rawIdentifier.toLowerCase() };
        } else {
            // Treat as phone login (Pakistani format: +92XXXXXXXXXX or 03XXXXXXXXX)
            const cleanedPhone = rawIdentifier.replace(/[\s-]/g, '');
            userQuery = { phone: cleanedPhone };
        }

        const user = await User.findOne(userQuery).select('+password');
        if (!user) {
            console.log('❌ Login failed: User not found for query:', userQuery);
            return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
        }

        console.log('✅ User found:', user.email, '| Has password hash:', !!user.password);
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('🔑 Password match:', isMatch);
        
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
        }

        const token = signToken(user._id);
        const safeUser = await buildUserResponse(user, false); // Don't include stats on login

        return res.json({
            status: 'success',
            token,
            user: safeUser,
            role: safeUser.role,
            isPaid: safeUser.isPaid,
            isVerified: safeUser.isVerified,
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ status: 'error', message: 'Login failed' });
    }
};

// POST /api/auth/send-verification-email
exports.sendVerificationEmail = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        const token = signEmailVerificationToken(user._id);

        await Verification.findOneAndUpdate(
            { user: user._id, type: 'email' },
            {
                user: user._id,
                type: 'email',
                status: 'pending',
                'data.token': token,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            },
            { upsert: true, new: true }
        );

        // TODO: integrate mailer to send token link
        return res.json({
            status: 'success',
            message: 'Verification email generated.',
            token, // surfaced for dev; remove in production
        });
    } catch (err) {
        console.error('Send verification email error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to send verification email' });
    }
};

// POST /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ status: 'error', message: 'Token is required' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.purpose !== 'verify_email') {
            return res.status(400).json({ status: 'error', message: 'Invalid token purpose' });
        }

        const user = await User.findById(decoded.id);
        if (!user) return res.status(400).json({ status: 'error', message: 'User not found' });

        await Verification.findOneAndUpdate(
            { user: user._id, type: 'email', 'data.token': token },
            { status: 'approved', 'result.verified': true, 'result.verifiedAt': new Date() }
        );

        user.verified = true;
        user.verificationStatus = user.verificationStatus || {};
        user.verificationStatus.email = true;
        await user.save();

        return res.json({ status: 'success', message: 'Email verified' });
    } catch (err) {
        console.error('Verify email error:', err);
        return res.status(400).json({ status: 'error', message: 'Invalid or expired token' });
    }
};

// POST /api/auth/send-otp
exports.sendOtp = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });

        if (!user.phone) {
            return res.status(400).json({ 
                status: 'error', 
                message: 'Phone number not registered. Please add a phone number to your profile.' 
            });
        }

        const otp = createOtp();
        await Verification.findOneAndUpdate(
            { user: user._id, type: 'phone' },
            {
                user: user._id,
                type: 'phone',
                status: 'pending',
                'data.code': otp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                attempts: 0,
            },
            { upsert: true, new: true }
        );

        // Send OTP via SMS service (simulated for development)
        const smsService = require('../services/smsService');
        const smsResult = await smsService.sendOTP(user.phone, otp);

        if (!smsResult.success) {
            console.warn('⚠️ SMS sending failed, but OTP is saved. Check console for OTP.');
        }

        // In development: return OTP for testing (remove in production)
        const isDevelopment = process.env.NODE_ENV !== 'production';
        return res.json({
            status: 'success',
            message: 'OTP sent to your phone number',
            ...(isDevelopment && { 
                otp, // Only in development - remove in production
                note: 'Development mode: OTP shown in response. Check server console for SMS simulation.'
            })
        });
    } catch (err) {
        console.error('Send OTP error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to send OTP' });
    }
};

// POST /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
    try {
        const user = req.user;
        const { otp } = req.body;
        if (!user) return res.status(401).json({ status: 'error', message: 'Unauthorized' });
        if (!otp) return res.status(400).json({ status: 'error', message: 'OTP is required' });

        const record = await Verification.findOne({ user: user._id, type: 'phone' });
        if (!record || record.status !== 'pending') {
            return res.status(400).json({ status: 'error', message: 'No pending OTP' });
        }
        if (record.expiresAt && record.expiresAt < new Date()) {
            return res.status(400).json({ status: 'error', message: 'OTP expired' });
        }
        if (record.data.code !== otp) {
            const attempts = (record.attempts || 0) + 1;
            record.attempts = attempts;
            await record.save();
            return res.status(400).json({ status: 'error', message: 'Invalid OTP' });
        }

        record.status = 'approved';
        record.result = { verified: true, verifiedAt: new Date() };
        await record.save();

        user.verificationStatus = user.verificationStatus || {};
        user.verificationStatus.phone = true;
        await user.save();

        return res.json({ status: 'success', message: 'Phone verified' });
    } catch (err) {
        console.error('Verify OTP error:', err);
        return res.status(400).json({ status: 'error', message: 'Failed to verify OTP' });
    }
};
exports.me = async (req, res) => {
    try {
        const safeUser = await buildUserResponse(req.user, true); // Include stats
        return res.json({ status: 'success', user: safeUser });
    } catch (err) {
        console.error('Me error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to load profile' });
    }
};

// Export helper for other controllers (e.g., profileController)
exports.buildUserResponse = buildUserResponse;
