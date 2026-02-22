const User = require('../models/User');
const { buildUserResponse } = require('./authController');

// GET /api/profile
// Returns the authenticated user's profile (same as /auth/me but under /profile)
exports.getProfile = async (req, res) => {
    try {
        return res.json({ status: 'success', user: req.user });
    } catch (err) {
        console.error('Get profile error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to load profile' });
    }
};

// PUT /api/profile
// Updates basic profile fields for the authenticated user
exports.updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const {
            name,
            fullName,
            phone,
            mobile,
            bio,
            location,
            language,
            avatar,
            dateOfBirth,
        } = req.body;

        const errors = [];

        const nameValue = (name || fullName || '').trim();
        if (nameValue && nameValue.length < 2) {
            errors.push('Name must be at least 2 characters');
        }

        const phoneValue = (phone || mobile || '').trim();
        if (phoneValue) {
            const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
            const cleaned = phoneValue.replace(/[\s-]/g, '');
            if (!phoneRegex.test(cleaned)) {
                errors.push('Please enter a valid phone number');
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Validation failed', errors });
        }

        // Apply updates
        if (nameValue) {
            user.name = nameValue;
        }

        if (phoneValue) {
            // Normalize and update phone
            const cleaned = phoneValue.replace(/[\s-]/g, '');
            user.phone = cleaned;
        }

        if (typeof bio === 'string') {
            user.bio = bio.trim();
        }

        if (typeof language === 'string') {
            user.language = language;
        }

        // Store date of birth if provided (optional)
        if (dateOfBirth) {
            const dob = new Date(dateOfBirth);
            if (!Number.isNaN(dob.getTime())) {
                user.dateOfBirth = dob;
            }
        }

        // Update avatar (profile picture) if provided
        if (typeof avatar === 'string' && avatar.trim()) {
            user.avatar = avatar.trim();
        }

        if (location) {
            // Frontend currently sends location as a single string "City, Province"
            // For now, store it in location.address and try to split into city/province
            const locText = String(location).trim();
            const parts = locText.split(',').map((p) => p.trim());
            user.location = user.location || {};
            user.location.address = locText;
            if (parts.length >= 1) {
                user.location.city = parts[0];
            }
            if (parts.length >= 2) {
                user.location.province = parts[1];
            }
        }

        await user.save();

        const safeUser = buildUserResponse(user);
        return res.json({ status: 'success', user: safeUser });
    } catch (err) {
        console.error('Update profile error:', err);

        // Handle duplicate phone error gracefully
        if (err && err.code === 11000 && err.keyPattern && err.keyPattern.phone) {
            return res
                .status(400)
                .json({ status: 'error', message: 'User with this mobile number already exists' });
        }

        return res.status(500).json({ status: 'error', message: 'Failed to update profile' });
    }
};

// PUT /api/profile/password
// Change account password
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const errors = [];

        if (!currentPassword) errors.push('Current password is required');
        if (!newPassword) errors.push('New password is required');
        if (!confirmPassword) errors.push('Confirm new password is required');
        if (newPassword && newPassword.length < 8) {
            errors.push('New password must be at least 8 characters long');
        }
        if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            errors.push('New password and confirm password do not match');
        }
        if (newPassword && currentPassword && newPassword === currentPassword) {
            errors.push('New password must be different from current password');
        }

        if (errors.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Validation failed', errors });
        }

        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ status: 'error', message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        return res.json({ status: 'success', message: 'Password updated successfully' });
    } catch (err) {
        console.error('Update password error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to update password' });
    }
};

// PUT /api/profile/settings/notifications
// Update notification preferences
exports.updateNotificationSettings = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const {
            email,
            sms,
            push,
            bookingUpdates,
            messages,
            reviews,
        } = req.body;

        user.settings = user.settings || {};
        user.settings.notifications = user.settings.notifications || {};

        if (typeof email === 'boolean') user.settings.notifications.email = email;
        if (typeof sms === 'boolean') user.settings.notifications.sms = sms;
        if (typeof push === 'boolean') user.settings.notifications.push = push;
        if (typeof bookingUpdates === 'boolean') user.settings.notifications.bookingUpdates = bookingUpdates;
        if (typeof messages === 'boolean') user.settings.notifications.messages = messages;
        if (typeof reviews === 'boolean') user.settings.notifications.reviews = reviews;

        await user.save();

        const safeUser = buildUserResponse(user);
        return res.json({ status: 'success', user: safeUser });
    } catch (err) {
        console.error('Update notification settings error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to update notification settings' });
    }
};

// PUT /api/profile/settings/preferences
// Update language / timezone preferences
exports.updatePreferences = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const { language, timezone } = req.body;

        if (language) {
            user.language = language;
        }

        user.settings = user.settings || {};
        user.settings.preferences = user.settings.preferences || {};
        if (timezone) {
            user.settings.preferences.timezone = timezone;
        }

        await user.save();

        const safeUser = buildUserResponse(user);
        return res.json({ status: 'success', user: safeUser });
    } catch (err) {
        console.error('Update preferences error:', err);
        return res.status(500).json({ status: 'error', message: 'Failed to update preferences' });
    }
};

