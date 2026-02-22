// Profile Page Functionality
// Modern, production-ready implementation

(function() {
    'use strict';

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initProfilePage();
        console.log('✅ Profile page initialized');
    });

    // State
    let bookingsLoaded = false;
    let cachedBookings = [];

    // Utility function to generate local placeholder image (SVG data URI)
    function getPlaceholderImage(width = 400, height = 300, text = 'No Image') {
        const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#e9ecef"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#6c757d" text-anchor="middle" dominant-baseline="middle">${text}</text>
        </svg>`;
        return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    }

    // Initialize profile page
    function initProfilePage() {
        // Decide initial tab based on role (owners go to Owner Dashboard)
        const role = window.getCurrentRole ? window.getCurrentRole() : null;
        const isOwnerRole = role === 'owner' || role === 'dual_role' || role === 'admin';
        const isOwnerOnly = role === 'owner' || role === 'admin';

        // Ensure proper visibility of stats headers on initialization
        const ownerHeaderStats = document.getElementById('ownerStatsHeader');
        const renterStatsHeader = document.getElementById('renterStatsHeader');
        
        if (isOwnerOnly) {
            // Owner-only: hide renter stats, show owner stats
            if (renterStatsHeader) {
                renterStatsHeader.style.display = 'none';
                renterStatsHeader.classList.remove('show');
            }
            if (ownerHeaderStats) {
                ownerHeaderStats.style.display = 'grid';
                ownerHeaderStats.classList.add('show');
            }
        } else if (!isOwnerRole) {
            // Pure renter: hide owner stats, show renter stats
            if (ownerHeaderStats) {
                ownerHeaderStats.style.display = 'none';
                ownerHeaderStats.classList.remove('show');
            }
            if (renterStatsHeader) {
                renterStatsHeader.style.display = 'grid';
                renterStatsHeader.classList.add('show');
            }
        }
        // Dual role: both will be shown/hidden by loadRenterStats()

        // Set initial tab
        switchTab(isOwnerRole ? 'owner' : 'overview');

        // Initialize form validation
        initFormValidation();

        // Load user data from auth/me
        loadUserData();
        // Load stats (renter + owner where applicable)
        loadRenterStats();
    }

    // Switch between tabs
    window.switchTab = function(tabName) {
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all nav tabs
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => {
            tab.classList.remove('active');
        });

        // Show selected tab content
        const selectedTab = document.getElementById(tabName + 'Tab');
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Add active class to selected nav tab
        const selectedNavTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (selectedNavTab) {
            selectedNavTab.classList.add('active');
        }

        // Lazy-load bookings when Bookings tab is opened (renter view)
        if (tabName === 'bookings' && !bookingsLoaded) {
            loadRenterBookings();
        }

        // Lazy-load owner dashboard data when Owner tab is opened
        if (tabName === 'owner') {
            loadOwnerDashboard();
        }
    };

    // Handle profile picture change
    window.handleProfilePictureChange = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        // Preview image and then upload as data URL
        const reader = new FileReader();
        reader.onload = function(e) {
            const dataUrl = e.target.result;
            const profilePicture = document.getElementById('profilePicture');
            if (profilePicture) {
                profilePicture.src = dataUrl;
            }

            // Upload profile picture to backend so it persists
            uploadProfilePicture(dataUrl);
        };
        reader.readAsDataURL(file);
    };

    // Upload profile picture (real API call via /api/profile with avatar field)
    async function uploadProfilePicture(dataUrl) {
        const profilePicture = document.getElementById('profilePicture');
        const token = localStorage.getItem('mr-token');

        if (!token) {
            showErrorMessage('Please log in to update your profile picture.');
            return;
        }

        if (profilePicture) {
            profilePicture.style.opacity = '0.5';
        }

        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ avatar: dataUrl }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.status !== 'success' || !data.user) {
                const message =
                    (data && data.message) ||
                    (data && data.errors && data.errors.join(', ')) ||
                    'Failed to update profile picture';
                showErrorMessage(message);
                return;
            }

            // Update UI with saved avatar
            const savedUser = data.user;
            if (profilePicture && savedUser.avatar) {
                profilePicture.src = savedUser.avatar;
                profilePicture.style.opacity = '1';
            }

            // Update local storage / auth state so avatar persists after refresh
            if (window.saveUserToStorage) {
                const role =
                    savedUser.role ||
                    (window.getCurrentRole && window.getCurrentRole()) ||
                    'renter';
                window.saveUserToStorage(savedUser, role);
            }

            showSuccessMessage('Profile picture updated successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            showErrorMessage('An error occurred while uploading the image');
        } finally {
            if (profilePicture) {
                profilePicture.style.opacity = '1';
            }
        }
    }

    // Handle personal info form submission
    window.handlePersonalInfoSubmit = async function(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const formData = {
            fullName: document.getElementById('fullName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            bio: document.getElementById('bio').value.trim(),
            location: document.getElementById('location').value.trim(),
            dateOfBirth: document.getElementById('dateOfBirth').value
        };

        // Validate form
        if (!validatePersonalInfo(formData)) {
            return;
        }

        // Require auth token
        const token = localStorage.getItem('mr-token');
        if (!token) {
            showErrorMessage('Your session has expired. Please log in again.');
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return;
        }

        // Disable submit button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinning"></i> Saving...';
        }

        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: formData.fullName,
                    phone: formData.phone,
                    bio: formData.bio,
                    location: formData.location,
                }),
            });

            const data = await response.json();

            if (!response.ok || data.status !== 'success') {
                console.error('Profile update failed:', data);
                const message =
                    (data && data.message) ||
                    (data && data.errors && data.errors.join(', ')) ||
                    'Failed to update profile';
                showErrorMessage(message);
            } else {
                // Use backend user object to refresh auth state, then reload from /auth/me
                if (data.user && window.saveUserToStorage) {
                    const role =
                        data.user.role ||
                        (window.getCurrentRole && window.getCurrentRole()) ||
                        'renter';
                    window.saveUserToStorage(data.user, role);
                }

                // Always reload fresh profile data so UI reflects what the backend actually saved
                await loadUserData();
                showSuccessMessage('Profile updated successfully!');
            }
        } catch (error) {
            console.error('Update error:', error);
            showErrorMessage('An error occurred. Please try again.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-check-lg"></i> Save Changes';
            }
        }
    };

    // Validate personal info
    function validatePersonalInfo(data) {
        let isValid = true;

        // Validate full name
        if (!data.fullName || data.fullName.length < 2) {
            showError('fullName-error', 'Name must be at least 2 characters');
            isValid = false;
        } else {
            clearError('fullName-error');
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showError('email-error', 'Please enter a valid email address');
            isValid = false;
        } else {
            clearError('email-error');
        }

        // Validate phone
        const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
        const cleanPhone = data.phone.replace(/[\s-]/g, '');
        if (!phoneRegex.test(cleanPhone)) {
            showError('phone-error', 'Please enter a valid phone number');
            isValid = false;
        } else {
            clearError('phone-error');
        }

        return isValid;
    }

    // Update profile display
    function updateProfileDisplay(data) {
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profilePhone = document.getElementById('profilePhone');
        const profileBio = document.getElementById('profileBio');
        const profileLocation = document.getElementById('profileLocation');

        if (profileName) profileName.textContent = data.fullName;
        if (profileEmail) profileEmail.textContent = data.email;
        if (profilePhone) profilePhone.textContent = data.phone;
        if (profileBio) profileBio.textContent = data.bio || 'No bio available';
        if (profileLocation) profileLocation.textContent = data.location;
    }

    // Reset personal info form
    window.resetPersonalInfoForm = function() {
        // Reload user data to reset form
        loadUserData();
        showInfoMessage('Form reset to original values');
    };

    // Handle password change
    window.handlePasswordChange = async function(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        // Validate passwords
        if (!validatePasswordChange(currentPassword, newPassword, confirmPassword)) {
            return;
        }

        const token = localStorage.getItem('mr-token');
        if (!token) {
            showErrorMessage('Your session has expired. Please log in again.');
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return;
        }

        // Disable submit button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinning"></i> Updating...';
        }

        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/profile/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok || data.status !== 'success') {
                const message =
                    (data && data.message) ||
                    (data && data.errors && data.errors.join(', ')) ||
                    'Failed to update password';
                showError('currentPassword-error', message);
                showErrorMessage(message);
            } else {
            form.reset();
            showSuccessMessage('Password updated successfully!');
            }
        } catch (error) {
            console.error('Password update error:', error);
            showErrorMessage('An error occurred. Please try again.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class=\"bi bi-shield-check\"></i> Update Password';
            }
        }
    };

    // Validate password change
    function validatePasswordChange(currentPassword, newPassword, confirmPassword) {
        let isValid = true;

        if (!currentPassword) {
            showError('currentPassword-error', 'Current password is required');
            isValid = false;
        } else {
            clearError('currentPassword-error');
        }

        if (!newPassword || newPassword.length < 8) {
            showError('newPassword-error', 'Password must be at least 8 characters');
            isValid = false;
        } else {
            clearError('newPassword-error');
        }

        if (newPassword !== confirmPassword) {
            showError('confirmNewPassword-error', 'Passwords do not match');
            isValid = false;
        } else {
            clearError('confirmNewPassword-error');
        }

        if (currentPassword === newPassword) {
            showError('newPassword-error', 'New password must be different from current password');
            isValid = false;
        }

        return isValid;
    }

    // Toggle password visibility
    window.togglePasswordVisibility = function(inputId, eyeId) {
        const passwordInput = document.getElementById(inputId);
        const passwordEye = document.getElementById(eyeId);

        if (passwordInput && passwordEye) {
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                passwordEye.className = 'bi bi-eye-slash';
            } else {
                passwordInput.type = 'password';
                passwordEye.className = 'bi bi-eye';
            }
        }
    };

    // Remove session
    window.removeSession = function(button) {
        const sessionItem = button.closest('.session-item');
        if (confirm('Are you sure you want to remove this session?')) {
            // Simulate API call
            sessionItem.style.opacity = '0.5';
            setTimeout(() => {
                sessionItem.remove();
                showSuccessMessage('Session removed successfully');
            }, 500);
        }
    };

    // Start ID verification
    window.startIDVerification = function() {
        const item = document.querySelector('.verification-item.pending button[onclick*="startIDVerification"]')?.closest('.verification-item');
        if (item) {
            item.classList.remove('pending');
            item.classList.add('verified');
            const badge = item.querySelector('.verification-badge');
            if (badge) badge.textContent = 'Verified (demo)';
            const btn = item.querySelector('button');
            if (btn) {
                btn.textContent = 'Uploaded (demo)';
                btn.disabled = true;
            }
        }
        showSuccessMessage('ID uploaded (demo mode). In production, this will upload and verify your ID.');
    };

    // Start biometric verification
    window.startBiometricVerification = function() {
        const item = document.querySelector('.verification-item.pending button[onclick*="startBiometricVerification"]')?.closest('.verification-item');
        if (item) {
            item.classList.remove('pending');
            item.classList.add('verified');
            const badge = item.querySelector('.verification-badge');
            if (badge) badge.textContent = 'Verified (demo)';
            const btn = item.querySelector('button');
            if (btn) {
                btn.textContent = 'Completed (demo)';
                btn.disabled = true;
            }
        }
        showSuccessMessage('Biometric verification simulated (demo mode). In production, this will use WebAuthn/biometric checks.');
    };

    // Save notification preferences
    window.saveNotificationPreferences = async function() {
        const form = document.getElementById('notificationForm');
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        const token = localStorage.getItem('mr-token');
        if (!token) {
            showErrorMessage('Your session has expired. Please log in again.');
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return;
        }

        const payload = {
            email: checkboxes[0]?.checked ?? true,
            sms: checkboxes[1]?.checked ?? false,
            bookingUpdates: checkboxes[2]?.checked ?? true,
            messages: checkboxes[3]?.checked ?? true,
        };

        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/profile/settings/notifications`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!response.ok || data.status !== 'success') {
                const message = (data && data.message) || 'Failed to save notification preferences';
                showErrorMessage(message);
            } else {
                if (data.user && window.saveUserToStorage) {
                    const role =
                        data.user.role ||
                        (window.getCurrentRole && window.getCurrentRole()) ||
                        'renter';
                    window.saveUserToStorage(data.user, role);
                }
        showSuccessMessage('Notification preferences saved successfully!');
            }
        } catch (error) {
            console.error('Notification preferences error:', error);
            showErrorMessage('An error occurred. Please try again.');
        }
    };

    // Save language preferences
    window.saveLanguagePreferences = async function() {
        const form = document.getElementById('languageForm');
        const language = document.getElementById('preferredLanguage').value;
        const timezone = document.getElementById('timezone').value;
        const token = localStorage.getItem('mr-token');
        if (!token) {
            showErrorMessage('Your session has expired. Please log in again.');
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return;
        }

        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/profile/settings/preferences`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ language, timezone }),
            });

            const data = await response.json();

            if (!response.ok || data.status !== 'success') {
                const message = (data && data.message) || 'Failed to save preferences';
                showErrorMessage(message);
            } else {
                if (data.user && window.saveUserToStorage) {
                    const role =
                        data.user.role ||
                        (window.getCurrentRole && window.getCurrentRole()) ||
                        'renter';
                    window.saveUserToStorage(data.user, role);
                }
                showSuccessMessage('Language & region preferences saved successfully!');
            }
        } catch (error) {
            console.error('Language preferences error:', error);
            showErrorMessage('An error occurred. Please try again.');
        }
    };

    // Initialize form validation
    function initFormValidation() {
        // Add real-time validation listeners
        const inputs = document.querySelectorAll('.form-control');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
        });
    }

    // Validate individual field
    function validateField(field) {
        const fieldId = field.id;
        const value = field.value.trim();

        switch (fieldId) {
            case 'fullName':
                if (value.length < 2) {
                    showError(fieldId + '-error', 'Name must be at least 2 characters');
                } else {
                    clearError(fieldId + '-error');
                }
                break;
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    showError(fieldId + '-error', 'Please enter a valid email address');
                } else {
                    clearError(fieldId + '-error');
                }
                break;
            case 'phone':
                const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
                const cleanPhone = value.replace(/[\s-]/g, '');
                if (!phoneRegex.test(cleanPhone)) {
                    showError(fieldId + '-error', 'Please enter a valid phone number');
                } else {
                    clearError(fieldId + '-error');
                }
                break;
        }
    }

    // Load user data from backend (auth/me) and populate profile
    async function loadUserData() {
        try {
            // If not logged in, redirect to login
            if (!window.isLoggedIn || !window.isLoggedIn()) {
                sessionStorage.setItem('redirectAfterLogin', window.location.href);
                window.location.href = 'login.html';
                return;
            }

            const token = localStorage.getItem('mr-token');
            if (!token) {
                sessionStorage.setItem('redirectAfterLogin', window.location.href);
                window.location.href = 'login.html';
                return;
            }

            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) {
                throw new Error('Failed to load profile');
            }

            const data = await response.json();
            if (!data || data.status !== 'success' || !data.user) {
                throw new Error('Invalid profile response');
            }

            populateProfileData(data.user);
        } catch (error) {
            console.error('Error loading profile:', error);
            showErrorMessage('Unable to load profile. Please log in again.');
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
        }
    }

    // Populate profile data
    function populateProfileData(data) {
        // Update form fields
        const fullNameInput = document.getElementById('fullName');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const bioInput = document.getElementById('bio');
        const locationInput = document.getElementById('location');
        const dateOfBirthInput = document.getElementById('dateOfBirth');

        if (fullNameInput) fullNameInput.value = data.name || data.fullName || '';
        if (emailInput) emailInput.value = data.email || '';
        if (phoneInput) phoneInput.value = data.phone || '';
        if (bioInput) bioInput.value = data.bio || '';
        if (locationInput) {
            const locText = data.location?.city
                ? [data.location.city, data.location.province].filter(Boolean).join(', ')
                : (data.location?.address || data.location || '');
            locationInput.value = locText || '';
        }
        if (dateOfBirthInput) dateOfBirthInput.value = data.dateOfBirth || '';

        // Update display elements
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profilePhone = document.getElementById('profilePhone');
        const profileBio = document.getElementById('profileBio');
        const profileLocation = document.getElementById('profileLocation');
        const profilePicture = document.getElementById('profilePicture');
        const memberSince = document.getElementById('memberSince');
        const profileRole = document.getElementById('profileRole');
        const accountType = document.getElementById('accountType');

        // Prefer backend fields; fall back to stored auth user
        const fullName = data.name || data.fullName || '';
        const email = data.email || '';
        const phone = data.phone || data.mobile || '';
        const bio = data.bio || '';
        const locationText = data.location?.city
            ? [data.location.city, data.location.province].filter(Boolean).join(', ')
            : (data.location?.address || data.location || '');
        const memberSinceText = data.createdAt ? new Date(data.createdAt).toLocaleDateString() : '';
        const roleDisplay = window.getRoleDisplayName ? window.getRoleDisplayName(data.role) : (data.role || '');
        const accountTypeLabel = data.accountType === 'paid' ? 'Premium Account' : 'Free Account';

        if (profileName) profileName.textContent = fullName || 'User';
        if (profileEmail) profileEmail.textContent = email;
        if (profilePhone) profilePhone.textContent = phone;
        if (profileBio) profileBio.textContent = bio || 'No bio available';
        if (profileLocation) profileLocation.textContent = locationText || '';
        if (memberSince) memberSince.textContent = memberSinceText;
        if (profileRole) profileRole.textContent = roleDisplay || '';
        if (accountType) accountType.textContent = accountTypeLabel;

        // Sync profile picture with backend avatar so it persists after refresh
        if (profilePicture) {
            if (data.avatar) {
                profilePicture.src = data.avatar;
            } else if (!profilePicture.src || profilePicture.src.startsWith('data:image/svg+xml')) {
                // Keep existing placeholder if no avatar set
                profilePicture.src = profilePicture.src;
            }
        }

        // Expose current user id globally for other modules (owner reviews, messaging, etc.)
        if (data._id || data.id) {
            window.currentUserId = data._id || data.id;
        }

        // (Header stats will be filled by loadRenterStats / updateBookingHeaderStats)
        // Update verification badges
        const verificationBadge = document.getElementById('verificationBadge');
        if (verificationBadge) {
            const isVerified = data.verified || (data.verificationStatus && data.verificationStatus.email && data.verificationStatus.phone);
            verificationBadge.classList.toggle('verified', !!isVerified);
            verificationBadge.querySelector('span').textContent = isVerified ? 'Verified' : 'Not Verified';
        }
    }

    // ============================
    // User Stats (Renter or Owner)
    // ============================

    async function loadRenterStats() {
        try {
            const token = localStorage.getItem('mr-token');
            if (!token) return;

            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            
            // Get user role to determine which stats to show
            const user = JSON.parse(localStorage.getItem('mr-user') || localStorage.getItem('user') || '{}');
            const userRole = user.role || user.activeRole || 'renter';
            const isOwner = userRole === 'owner' || userRole === 'dual_role' || userRole === 'admin';
            const isOwnerOnly = userRole === 'owner' || userRole === 'admin';

            // Get references to stats headers
            const renterStatsHeader = document.getElementById('renterStatsHeader');
            const ownerHeaderStats = document.getElementById('ownerStatsHeader');

            // If this is an owner-only account, skip renter stats entirely
            // and show ONLY owner dashboard/header stats.
            if (isOwnerOnly) {
                if (renterStatsHeader) {
                    renterStatsHeader.style.display = 'none';
                    renterStatsHeader.classList.remove('show');
                }

                const activitySummaryCard = document.getElementById('activitySummaryCard');
                if (activitySummaryCard) activitySummaryCard.style.display = 'none';

                const renterBookingsTabBtn = document.getElementById('renterBookingsTabBtn');
                if (renterBookingsTabBtn) renterBookingsTabBtn.style.display = 'none';

                const bookingsTab = document.getElementById('bookingsTab');
                if (bookingsTab) bookingsTab.style.display = 'none';

                const ownerTabBtn = document.getElementById('ownerTabBtn');
                if (ownerTabBtn) ownerTabBtn.style.display = 'flex';

                if (ownerHeaderStats) {
                    ownerHeaderStats.style.display = 'grid';
                    ownerHeaderStats.classList.add('show');
                }

                await loadOwnerStats();
                return;
            }

            // For pure renters, ensure owner stats header is hidden
            if (!isOwner) {
                if (ownerHeaderStats) {
                    ownerHeaderStats.style.display = 'none';
                    ownerHeaderStats.classList.remove('show');
                }
                if (renterStatsHeader) {
                    renterStatsHeader.style.display = 'grid';
                    renterStatsHeader.classList.add('show');
                }
            }

            // Load renter stats (for renter or dual_role users)
            const renterResponse = await fetch(`${apiBase}/renter/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const renterData = await renterResponse.json().catch(() => ({}));
            
            if (renterResponse.ok && renterData.status === 'success' && renterData.stats) {
                const { totalBookings, activeBookings, completedBookings, cancelledBookings, reviewsGiven } = renterData.stats;

                // Header stats (renter section)
                const totalBookingsEl = document.getElementById('totalBookingsCount');
                const activeBookingsEl = document.getElementById('activeBookingsCount');
                const cancelledBookingsEl = document.getElementById('cancelledBookingsCount');
                const reviewsGivenEl = document.getElementById('reviewsGivenCount');

                if (totalBookingsEl) totalBookingsEl.textContent = totalBookings || 0;
                if (activeBookingsEl) activeBookingsEl.textContent = activeBookings || 0;
                if (cancelledBookingsEl) cancelledBookingsEl.textContent = cancelledBookings || 0;
                if (reviewsGivenEl) reviewsGivenEl.textContent = reviewsGiven || 0;

                // Activity Summary card (renter) - only populate if user is NOT owner-only
                if (!isOwnerOnly) {
                    const activityCompletedEl = document.getElementById('activityCompleted');
                    const activityPendingEl = document.getElementById('activityPending');
                    const activityCancelledEl = document.getElementById('activityCancelled');

                    if (activityCompletedEl) activityCompletedEl.textContent = completedBookings || 0;
                    if (activityPendingEl) activityPendingEl.textContent = activeBookings || 0;
                    if (activityCancelledEl) activityCancelledEl.textContent = cancelledBookings || 0;
                }
            }

            // For dual_role users, also show owner header stats + dashboard
            if (isOwner && !isOwnerOnly) {
                const ownerTabBtn = document.getElementById('ownerTabBtn');
                if (ownerTabBtn) ownerTabBtn.style.display = 'flex';

                if (ownerHeaderStats) {
                    ownerHeaderStats.style.display = 'grid';
                    ownerHeaderStats.classList.add('show');
                }
                if (renterStatsHeader) {
                    renterStatsHeader.style.display = 'grid';
                    renterStatsHeader.classList.add('show');
                }

                await loadOwnerStats();
            }
        } catch (error) {
            console.warn('User stats load error:', error);
        }
    }

    // Load owner-specific stats
    async function loadOwnerStats() {
        try {
            const token = localStorage.getItem('mr-token');
            if (!token) return;

            // Check user role - don't load owner stats for pure renters
            const user = JSON.parse(localStorage.getItem('mr-user') || localStorage.getItem('user') || '{}');
            const userRole = user.role || user.activeRole || 'renter';
            const isOwner = userRole === 'owner' || userRole === 'dual_role' || userRole === 'admin';
            
            if (!isOwner) {
                // Pure renter - ensure owner stats header is hidden
                const ownerHeaderStats = document.getElementById('ownerStatsHeader');
                if (ownerHeaderStats) {
                    ownerHeaderStats.style.display = 'none';
                    ownerHeaderStats.classList.remove('show');
                }
                return; // Don't load owner stats for pure renters
            }

            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/owner/stats`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.status !== 'success' || !data.stats) {
                console.warn('Failed to load owner stats:', data);
                return;
            }

            const stats = data.stats;

            // Show owner stats section if it exists
            const ownerStatsSection = document.getElementById('ownerStatsSection');
            if (ownerStatsSection) {
                ownerStatsSection.style.display = 'block';
            }

            // Update owner stat elements (header + dashboard summary)
            const ownerListingsEl = document.getElementById('ownerListingsCount');
            const ownerActiveListingsEl = document.getElementById('ownerActiveListingsCount');
            const ownerBookingsEl = document.getElementById('ownerBookingsCount');
            const ownerReviewsEl = document.getElementById('ownerReviewsCount');
            const ownerRatingEl = document.getElementById('ownerRatingValue');
            const ownerEarningsEl = document.getElementById('ownerEarningsAmount');

            if (ownerListingsEl) ownerListingsEl.textContent = stats.totalListings || 0;
            if (ownerActiveListingsEl) ownerActiveListingsEl.textContent = stats.activeListings || 0;
            if (ownerBookingsEl) ownerBookingsEl.textContent = stats.totalBookings || 0;
            if (ownerReviewsEl) ownerReviewsEl.textContent = stats.reviewsReceived || 0;
            if (ownerRatingEl) ownerRatingEl.textContent = stats.averageRating ? stats.averageRating.toFixed(1) : '0.0';
            if (ownerEarningsEl) ownerEarningsEl.textContent = `Rs ${(stats.totalEarnings || 0).toLocaleString()}`;

            // Dashboard summary cards
            const ownerActiveListingsSummaryEl = document.getElementById('ownerActiveListingsCountSummary');
            const ownerTotalBookingsSummaryEl = document.getElementById('ownerTotalBookingsSummary');
            const ownerReviewsCountEl = document.getElementById('ownerReviewsCount');

            if (ownerActiveListingsSummaryEl) ownerActiveListingsSummaryEl.textContent = stats.activeListings || 0;
            if (ownerTotalBookingsSummaryEl) ownerTotalBookingsSummaryEl.textContent = stats.totalBookings || 0;
            if (ownerReviewsCountEl) ownerReviewsCountEl.textContent = stats.reviewsReceived || 0;

            // Populate Activity Summary for owners (in Overview tab)
            // Completed Bookings = completedBookings
            // Pending Requests = pendingBookings
            // Cancellations = cancelledBookings
            const activityCompletedEl = document.getElementById('activityCompleted');
            const activityPendingEl = document.getElementById('activityPending');
            const activityCancelledEl = document.getElementById('activityCancelled');

            if (activityCompletedEl) activityCompletedEl.textContent = stats.completedBookings || 0;
            if (activityPendingEl) activityPendingEl.textContent = stats.pendingBookings || 0;
            if (activityCancelledEl) activityCancelledEl.textContent = stats.cancelledBookings || 0;
        } catch (error) {
            console.warn('Owner stats load error:', error);
        }
    }

    // ============================
    // Owner Dashboard (Listings, Bookings, Reviews)
    // ============================

    let ownerDataLoaded = false;

    async function loadOwnerDashboard() {
        if (ownerDataLoaded) return;
        await Promise.all([
            loadOwnerListings(),
            loadOwnerBookings(),
            loadOwnerReviews(),
        ]);

        // Wire up Active Listings header click → my-listings active filter
        const activeListingsLink = document.getElementById('ownerActiveListingsLink');
        if (activeListingsLink) {
            activeListingsLink.onclick = function () {
                const url = new URL(window.location.origin + '/my-listings.html');
                url.searchParams.set('status', 'active');
                window.location.href = url.pathname + url.search; // keep relative path for file/http
            };
        }

        ownerDataLoaded = true;
    }

    async function loadOwnerListings() {
        const listEl = document.getElementById('ownerListingsList');
        const emptyEl = document.getElementById('ownerListingsEmpty');
        const loadingEl = document.getElementById('ownerListingsLoading');

        if (!listEl) return;

        listEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'none';
        if (loadingEl) loadingEl.style.display = 'flex';

        const token = localStorage.getItem('mr-token');
        if (!token) return;

        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/listings/owner/me`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.status !== 'success' || !Array.isArray(data.listings)) {
                console.error('Owner listings API error:', data);
                if (emptyEl) emptyEl.style.display = 'block';
                return;
            }

            if (data.listings.length === 0) {
                if (emptyEl) emptyEl.style.display = 'block';
                return;
            }

            listEl.innerHTML = data.listings
                .map(l => {
                    const status = l.status || 'draft';
                    const price = l.pricing?.amount || 0;
                    const model = l.pricing?.model || 'daily';
                    const image =
                        (Array.isArray(l.images) && l.images[0]?.url) ||
                        l.featuredImage ||
                        getPlaceholderImage(300, 200, 'Listing');
                    const city = l.location?.city || '';
                    const totalBookings = l.bookingStats?.total || 0;
                    const pendingBookings = l.bookingStats?.pending || 0;
                    const activeBookings = l.bookingStats?.active || 0;

                    return `
                        <div class="owner-listing-card">
                            <div class="owner-listing-image">
                                <img src="${image}" alt="${l.title || 'Listing'}"
                                     onerror="this.src='${getPlaceholderImage(300, 200, 'Listing')}'">
                            </div>
                            <div class="owner-listing-main">
                                <h4 class="owner-listing-title">${l.title || 'Listing'}</h4>
                                <div class="owner-listing-meta">
                                    <span><i class="bi bi-geo-alt"></i> ${city}</span>
                                    <span><i class="bi bi-tag"></i> Rs ${price.toLocaleString()} / ${model}</span>
                                </div>
                                <div class="owner-listing-bookings">
                                    <span><i class="bi bi-collection"></i> Total bookings: ${totalBookings}</span>
                                    <span><i class="bi bi-clock-history"></i> Pending: ${pendingBookings}</span>
                                    <span><i class="bi bi-play-circle"></i> Active: ${activeBookings}</span>
                                </div>
                            </div>
                            <div class="owner-listing-side">
                                <span class="badge status-badge status-${status} text-capitalize">${status}</span>
                                <a href="listing-detail.html?id=${l.id}" class="btn btn-sm btn-outline-secondary mt-2">
                                    <i class="bi bi-eye"></i>
                                    View
                                </a>
                            </div>
                        </div>
                    `;
                })
                .join('');
        } catch (error) {
            console.error('Error loading owner listings:', error);
            if (emptyEl) emptyEl.style.display = 'block';
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    async function loadOwnerBookings() {
        const listEl = document.getElementById('ownerBookingsList');
        const emptyEl = document.getElementById('ownerBookingsEmpty');
        const loadingEl = document.getElementById('ownerBookingsLoading');

        if (!listEl) return;

        listEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'none';
        if (loadingEl) loadingEl.style.display = 'flex';

        const token = localStorage.getItem('mr-token');
        if (!token) return;

        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/bookings?role=owner`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.status !== 'success' || !Array.isArray(data.bookings)) {
                console.error('Owner bookings API error:', data);
                if (emptyEl) emptyEl.style.display = 'block';
                return;
            }

            if (data.bookings.length === 0) {
                if (emptyEl) emptyEl.style.display = 'block';
                return;
            }

            listEl.innerHTML = data.bookings
                .map(b => {
                    const listing = b.listing || {};
                    const renter = b.renter || {};
                    const status = b.status || 'pending';
                    const image =
                        (Array.isArray(listing.images) && listing.images[0]?.url) ||
                        listing.featuredImage ||
                        getPlaceholderImage(300, 200, 'Listing');
                    const checkIn = b.checkIn ? new Date(b.checkIn) : null;
                    const checkOut = b.checkOut ? new Date(b.checkOut) : null;
                    const dateRange =
                        checkIn && checkOut
                            ? `${checkIn.toLocaleDateString()} - ${checkOut.toLocaleDateString()}`
                            : 'Dates TBA';

                    // Generate action buttons based on booking status
                    let actionButtons = '';
                    if (status === 'pending') {
                        actionButtons = `
                            <div class="owner-booking-actions">
                                <button class="btn btn-sm btn-success" onclick="ownerAcceptBooking('${b.id}')">
                                    <i class="bi bi-check-lg"></i> Accept
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="ownerDeclineBooking('${b.id}')">
                                    <i class="bi bi-x-lg"></i> Decline
                                </button>
                                <button class="btn btn-sm btn-outline-primary" onclick="ownerMessageRenter('${renter._id || renter.id}', '${listing._id || listing.id}', '${b.id}')">
                                    <i class="bi bi-chat-dots"></i> Message
                                </button>
                            </div>
                        `;
                    } else if (status === 'confirmed') {
                        actionButtons = `
                            <div class="owner-booking-actions">
                                <button class="btn btn-sm btn-success" onclick="ownerCompleteBooking('${b.id}')">
                                    <i class="bi bi-check-circle"></i> Mark Complete
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="ownerCancelBooking('${b.id}')">
                                    <i class="bi bi-x-circle"></i> Cancel
                                </button>
                                <button class="btn btn-sm btn-outline-primary" onclick="ownerMessageRenter('${renter._id || renter.id}', '${listing._id || listing.id}', '${b.id}')">
                                    <i class="bi bi-chat-dots"></i> Message
                                </button>
                            </div>
                        `;
                    } else if (status === 'completed') {
                        actionButtons = `
                            <div class="owner-booking-actions">
                                <span class="text-success"><i class="bi bi-check-circle-fill"></i> Completed</span>
                            </div>
                        `;
                    } else if (status === 'cancelled') {
                        actionButtons = `
                            <div class="owner-booking-actions">
                                <span class="text-muted"><i class="bi bi-x-circle"></i> Cancelled</span>
                            </div>
                        `;
                    }

                    return `
                        <div class="owner-booking-card">
                            <div class="owner-booking-image">
                                <img src="${image}" alt="${listing.title || 'Listing'}"
                                     onerror="this.src='${getPlaceholderImage(300, 200, 'Listing')}'">
                            </div>
                            <div class="owner-booking-main">
                                <h4 class="owner-booking-title">${listing.title || 'Listing'}</h4>
                                <div class="owner-booking-meta">
                                    <span><i class="bi bi-person"></i> Guest: ${renter.name || 'N/A'}</span>
                                    <span><i class="bi bi-hash"></i> ${b.bookingNumber}</span>
                                </div>
                                <div class="owner-booking-meta">
                                    <span><i class="bi bi-calendar-event"></i> ${dateRange}</span>
                                    <span><i class="bi bi-people"></i> ${b.guests || 1} guest${(b.guests || 1) > 1 ? 's' : ''}</span>
                                </div>
                                <div class="owner-booking-actions mb-1">
                                    <button class="btn btn-sm btn-outline-secondary" onclick="openOwnerBookingDetails('${b.id}')">
                                        <i class="bi bi-eye"></i> View details
                                    </button>
                                </div>
                                ${actionButtons}
                            </div>
                            <div class="owner-booking-side">
                                <span class="badge status-badge status-${status} text-capitalize">${status}</span>
                                <div class="owner-booking-price">
                                    Rs ${(b.pricing?.total || 0).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    `;
                })
                .join('');
        } catch (error) {
            console.error('Error loading owner bookings:', error);
            if (emptyEl) emptyEl.style.display = 'block';
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    async function loadOwnerReviews() {
        const listEl = document.getElementById('ownerReviewsList');
        const emptyEl = document.getElementById('ownerReviewsEmpty');
        const loadingEl = document.getElementById('ownerReviewsLoading');

        if (!listEl) return;

        listEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'none';
        if (loadingEl) loadingEl.style.display = 'flex';

        const token = localStorage.getItem('mr-token');
        const ownerId =
            window.currentUserId ||
            (JSON.parse(localStorage.getItem('mr-user') || localStorage.getItem('user') || '{}')._id);
        if (!token || !ownerId) return;

        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            // Show all reviews (including pending) for owners to see their reviews
            const response = await fetch(`${apiBase}/reviews?ownerId=${ownerId}&status=all`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.status !== 'success' || !Array.isArray(data.reviews)) {
                console.error('Owner reviews API error:', data);
                if (emptyEl) emptyEl.style.display = 'block';
                return;
            }

            if (data.reviews.length === 0) {
                if (emptyEl) emptyEl.style.display = 'block';
                return;
            }

            listEl.innerHTML = data.reviews
                .map(r => {
                    const stars = '★'.repeat(r.rating || 0) + '☆'.repeat(5 - (r.rating || 0));
                    const reviewer = r.reviewer || {};
                    const listing = r.listing || {};
                    const createdAt = formatDateDisplay(r.createdAt);
                    const hasResponse = r.response && r.response.text;
                    const responseDate = r.response?.respondedAt ? formatDateDisplay(r.response.respondedAt) : '';

                    const safeResponseText = (r.response?.text || '')
                        .replace(/'/g, "\\'")
                        .replace(/"/g, '&quot;');

                    return `
                        <div class="owner-review-card">
                            <div class="owner-review-header">
                                <div class="owner-review-rating">
                                    <span class="stars">${stars}</span>
                                    <span class="rating-value">${r.rating || 0}/5</span>
                                </div>
                                <span class="review-date">${createdAt}</span>
                            </div>
                            <div class="owner-review-body">
                                <div class="owner-review-meta">
                                    <span><i class="bi bi-person"></i> ${reviewer.name || 'Guest'}</span>
                                    ${listing.title ? `<span><i class="bi bi-house-door"></i> ${listing.title}</span>` : ''}
                                </div>
                                ${r.comment ? `<p class="owner-review-comment">${r.comment}</p>` : ''}
                                
                                ${hasResponse ? `
                                    <div class="owner-response">
                                        <div class="owner-response-header">
                                            <i class="bi bi-reply-fill"></i>
                                            <strong>Your Response</strong>
                                            <span class="response-date">${responseDate}</span>
                                        </div>
                                        <p class="owner-response-text">${r.response.text}</p>
                                        <div class="owner-review-actions mt-2">
                                            <button class="btn btn-sm btn-outline-primary" onclick="openRespondModal('${r.id}', '${safeResponseText}')">
                                                <i class="bi bi-pencil"></i> Edit Response
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger" onclick="deleteReviewResponse('${r.id}')">
                                                <i class="bi bi-trash"></i> Delete Response
                                            </button>
                                        </div>
                                    </div>
                                ` : `
                                    <div class="owner-review-actions">
                                        <button class="btn btn-sm btn-outline-primary" onclick="openRespondModal('${r.id}')">
                                            <i class="bi bi-reply"></i> Respond to Review
                                        </button>
                                    </div>
                                `}
                            </div>
                        </div>
                    `;
                })
                .join('');
        } catch (error) {
            console.error('Error loading owner reviews:', error);
            if (emptyEl) emptyEl.style.display = 'block';
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    // ============================
    // Renter Bookings & Reviews
    // ============================

    async function loadRenterBookings() {
        const listEl = document.getElementById('profileBookingsList');
        const emptyEl = document.getElementById('profileBookingsEmpty');
        const loadingEl = document.getElementById('profileBookingsLoading');

        if (!listEl) return;

        listEl.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'none';
        if (loadingEl) loadingEl.style.display = 'flex';

        const token = localStorage.getItem('mr-token');
        if (!token) {
            showErrorMessage('Your session has expired. Please log in again.');
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return;
        }

        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/bookings?role=renter`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.status !== 'success' || !Array.isArray(data.bookings)) {
                console.error('Profile bookings API error:', data);
                showErrorMessage(data.message || 'Unable to load your bookings.');
                if (loadingEl) loadingEl.style.display = 'none';
                if (emptyEl) emptyEl.style.display = 'block';
                return;
            }

            // Normalize bookings
            const normalized = data.bookings.map(normalizeBookingFromApi);

            // Enrich with reviews
            const enriched = await enrichBookingsWithReviews(normalized);
            cachedBookings = enriched;
            bookingsLoaded = true;

            renderProfileBookings(enriched);

            // Update header stats for bookings (total / active / cancelled)
            updateBookingHeaderStats(enriched);

            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) emptyEl.style.display = enriched.length === 0 ? 'block' : 'none';
        } catch (error) {
            console.error('Error loading profile bookings:', error);
            showErrorMessage('Network error while loading bookings. Please try again.');
            if (loadingEl) loadingEl.style.display = 'none';
            if (emptyEl) emptyEl.style.display = 'block';
        }
    }

    function normalizeBookingFromApi(b) {
        const listing = b.listing || {};
        const owner = b.owner || {};

        return {
            id: b.id || b._id,
            bookingNumber: b.bookingNumber,
            status: b.status,
            checkIn: b.checkIn,
            checkOut: b.checkOut,
            guests: b.guests || 1,
            createdAt: b.createdAt,
            listing: {
                id: listing._id,
                title: listing.title || 'Listing',
                image:
                    (Array.isArray(listing.images) && listing.images[0]?.url) ||
                    listing.featuredImage ||
                    getPlaceholderImage(300, 200, 'Listing'),
                location:
                    listing.location?.city ||
                    listing.location?.address ||
                    '',
            },
            owner: {
                id: owner._id,
                name: owner.name || '',
            },
            pricing: {
                total: b.pricing?.total || 0,
                currency: b.pricing?.currency || 'PKR',
            },
        };
    }

    async function enrichBookingsWithReviews(bookings) {
        const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
        const tasks = bookings.map(async booking => {
            if (booking.status !== 'completed') return booking;

            try {
                const resp = await fetch(`${apiBase}/reviews?bookingId=${booking.id}`);
                const data = await resp.json().catch(() => ({}));
                if (data.status === 'success' && Array.isArray(data.reviews) && data.reviews.length > 0) {
                    booking.review = data.reviews[0];
                }
            } catch (err) {
                console.warn('Failed to load review for booking', booking.id, err);
            }
            return booking;
        });

        return Promise.all(tasks);
    }

    function renderProfileBookings(bookings) {
        const listEl = document.getElementById('profileBookingsList');
        if (!listEl) return;

        if (!bookings || bookings.length === 0) {
            listEl.innerHTML = '';
            return;
        }

        listEl.innerHTML = bookings
            .map(booking => {
                const statusLabel = booking.status || 'pending';
                const statusClass = `status-${statusLabel}`;

                const checkIn = booking.checkIn ? new Date(booking.checkIn) : null;
                const checkOut = booking.checkOut ? new Date(booking.checkOut) : null;
                const dateRange =
                    checkIn && checkOut
                        ? `${checkIn.toLocaleDateString()} - ${checkOut.toLocaleDateString()}`
                        : 'Dates TBA';

                const review = booking.review;
                const hasReview = !!review;

                let reviewHtml = '';
                if (hasReview) {
                    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                    reviewHtml = `
                        <div class="profile-review-summary">
                            <span class="profile-review-stars">${stars}</span>
                            <span>${review.rating.toFixed ? review.rating.toFixed(1) : review.rating}/5</span>
                            ${review.comment ? `<div class="profile-review-comment">${review.comment}</div>` : ''}
                        </div>
                    `;
                }

                const canReview = booking.status === 'completed';
                const reviewBtnLabel = hasReview ? 'Edit Review' : 'Give Review';

                return `
                    <div class="profile-booking-card">
                        <div class="profile-booking-image">
                            <img src="${booking.listing.image}" alt="${booking.listing.title}" 
                                 onerror="this.src='${getPlaceholderImage(300, 200, 'Listing')}'">
                        </div>
                        <div class="profile-booking-main">
                            <h4 class="profile-booking-title">${booking.listing.title}</h4>
                            <div class="profile-booking-meta">
                                <span><i class="bi bi-person"></i> Host: ${booking.owner.name || 'N/A'}</span>
                                <span><i class="bi bi-geo-alt"></i> ${booking.listing.location || ''}</span>
                                <span><i class="bi bi-hash"></i> ${booking.bookingNumber}</span>
                            </div>
                            <div class="profile-booking-meta">
                                <span><i class="bi bi-calendar-event"></i> ${dateRange}</span>
                                <span><i class="bi bi-people"></i> ${booking.guests} guest${booking.guests > 1 ? 's' : ''}</span>
                            </div>
                            ${reviewHtml}
                        </div>
                        <div class="profile-booking-actions">
                            <span class="profile-booking-status ${statusClass} text-capitalize">${statusLabel}</span>
                            <div class="profile-booking-price">
                                Rs ${booking.pricing.total.toLocaleString()}
                            </div>
                            <div>
                                <a href="listing-detail.html?id=${booking.listing.id}" class="btn btn-sm btn-outline-secondary">
                                    <i class="bi bi-eye"></i>
                                    View Listing
                                </a>
                            </div>
                            <div class="d-flex flex-column align-items-end gap-1 mt-2">
                                <button 
                                    class="btn-profile-review"
                                    ${!canReview ? 'disabled title="Reviews are only available after completion"' : ''}
                                    onclick="openProfileReviewModal('${booking.id}')"
                                >
                                    <i class="bi bi-star"></i>
                                    <span>${reviewBtnLabel}</span>
                                </button>
                                <button 
                                    class="btn btn-sm btn-outline-primary"
                                    ${booking.status === 'cancelled' || booking.status === 'completed' ? 'disabled title="Cannot cancel this booking"' : ''}
                                    onclick="openProfileCancelModal('${booking.id}')"
                                >
                                    <i class="bi bi-x-circle"></i>
                                    <span>Cancel Booking</span>
                                </button>
                                <button 
                                    class="btn btn-sm btn-outline-secondary"
                                    onclick="openProfileMessageHost('${booking.id}')"
                                >
                                    <i class="bi bi-chat-dots"></i>
                                    <span>Message Host</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            })
            .join('');
    }

    function updateBookingHeaderStats(bookings) {
        const totalBookingsEl = document.getElementById('totalBookingsCount');
        const activeBookingsEl = document.getElementById('activeBookingsCount');
        const cancelledBookingsEl = document.getElementById('cancelledBookingsCount');
        const reviewsGivenEl = document.getElementById('reviewsGivenCount');

        const total = bookings.length;
        const cancelled = bookings.filter(b => b.status === 'cancelled').length;
        const completed = bookings.filter(b => b.status === 'completed').length;
        const active = bookings.filter(b => ['pending', 'confirmed', 'active'].includes(b.status)).length;
        const reviewsGiven = bookings.filter(b => !!b.review).length;

        if (totalBookingsEl) totalBookingsEl.textContent = total;
        if (activeBookingsEl) activeBookingsEl.textContent = active;
        if (cancelledBookingsEl) cancelledBookingsEl.textContent = cancelled;
        if (reviewsGivenEl) reviewsGivenEl.textContent = reviewsGiven;
    }

    // Review modal for profile
    function ensureReviewModalStyles() {
        if (document.getElementById('review-modal-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'review-modal-styles';
        styles.textContent = `
            .review-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.2s ease;
            }
            .review-modal {
                background: #ffffff;
                border-radius: 16px;
                max-width: 500px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
            }
            .review-modal-header {
                padding: 1.5rem;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .review-modal-header h3 {
                margin: 0;
                font-size: 1.5rem;
                font-weight: 700;
            }
            .modal-close {
                background: none;
                border: none;
                font-size: 2rem;
                line-height: 1;
                cursor: pointer;
                color: #6c757d;
            }
            .review-modal-body {
                padding: 1.5rem;
            }
            .modal-actions {
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
                padding-top: 1rem;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }

    window.openProfileReviewModal = function(bookingId) {
        const booking = cachedBookings.find(b => String(b.id) === String(bookingId));
        if (!booking) {
            showErrorMessage('Booking not found for review.');
            return;
        }

        // Reuse same modal structure as my-bookings, but with different submit handler
        const existing = document.querySelector('.review-modal-overlay');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'review-modal-overlay';
        modal.innerHTML = `
            <div class="review-modal">
                <div class="review-modal-header">
                    <h3>Review your stay</h3>
                    <button class="modal-close" onclick="closeProfileReviewModal()">&times;</button>
                </div>
                <div class="review-modal-body">
                    <div class="mb-3 small text-muted">
                        <strong>${booking.listing.title}</strong><br>
                        ${booking.listing.location || ''}
                    </div>
                    <form id="profileReviewForm" onsubmit="submitProfileReview(event, '${booking.id}')">
                        <div class="form-group mb-3">
                            <label class="form-label">Rating <span class="required">*</span></label>
                            <div class="rating-input">
                                <input type="radio" id="pstar5" name="rating" value="5" required>
                                <label for="pstar5" title="5 stars">★</label>
                                <input type="radio" id="pstar4" name="rating" value="4">
                                <label for="pstar4" title="4 stars">★</label>
                                <input type="radio" id="pstar3" name="rating" value="3">
                                <label for="pstar3" title="3 stars">★</label>
                                <input type="radio" id="pstar2" name="rating" value="2">
                                <label for="pstar2" title="2 stars">★</label>
                                <input type="radio" id="pstar1" name="rating" value="1">
                                <label for="pstar1" title="1 star">★</label>
                            </div>
                        </div>
                        <div class="form-group mb-3">
                            <label for="profileReviewComment" class="form-label">Your Review</label>
                            <textarea id="profileReviewComment" name="comment" rows="4"
                                class="form-control"
                                placeholder="Share your experience with this listing..."
                                maxlength="1000"></textarea>
                            <small class="form-text text-muted">Optional - up to 1000 characters</small>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline-secondary" onclick="closeProfileReviewModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Submit Review</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        ensureReviewModalStyles();
    };

    window.closeProfileReviewModal = function() {
        const modal = document.querySelector('.review-modal-overlay');
        if (modal) modal.remove();
    };

    window.submitProfileReview = async function(event, bookingId) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const rating = formData.get('rating');
        const comment = formData.get('comment');

        if (!rating) {
            alert('Please select a rating');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
        }

        try {
            const token = localStorage.getItem('mr-token');
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';

            const response = await fetch(`${apiBase}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    bookingId,
                    rating: parseInt(rating, 10),
                    comment: comment || '',
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Failed to submit review');
            }

            closeProfileReviewModal();
            showSuccessMessage('Review submitted successfully!');

            // Reload bookings to show updated review info
            bookingsLoaded = false;
            await loadRenterBookings();
            await loadRenterStats();
        } catch (error) {
            console.error('Profile review submission error:', error);
            showErrorMessage(error.message || 'Failed to submit review. Please try again.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Review';
            }
        }
    };

    // ============================
    // Cancel Booking (Renter)
    // ============================

    window.openProfileCancelModal = function(bookingId) {
        const booking = cachedBookings.find(b => String(b.id) === String(bookingId));
        if (!booking) {
            showErrorMessage('Booking not found.');
            return;
        }

        const existing = document.querySelector('.review-modal-overlay');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'review-modal-overlay';
        modal.innerHTML = `
            <div class="review-modal">
                <div class="review-modal-header">
                    <h3>Cancel booking?</h3>
                    <button class="modal-close" onclick="closeProfileReviewModal()">&times;</button>
                </div>
                <div class="review-modal-body">
                    <p class="mb-3">
                        Are you sure you want to cancel this booking?
                        <br><strong>${booking.listing.title}</strong>
                    </p>
                    <form id="cancelBookingForm" onsubmit="submitProfileCancel(event, '${booking.id}')">
                        <div class="form-group mb-3">
                            <label for="cancelReason" class="form-label">Reason (optional)</label>
                            <textarea id="cancelReason" name="reason" rows="3" class="form-control"
                                placeholder="Tell the host why you need to cancel..."></textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline-secondary" onclick="closeProfileReviewModal()">Keep Booking</button>
                            <button type="submit" class="btn btn-danger">Yes, Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        ensureReviewModalStyles();
    };

    window.submitProfileCancel = async function(event, bookingId) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        const reason = formData.get('reason') || '';

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Cancelling...';
        }

        try {
            const token = localStorage.getItem('mr-token');
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/bookings/${bookingId}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || data.status !== 'success') {
                throw new Error(data.message || 'Failed to cancel booking');
            }

            closeProfileReviewModal();
            showSuccessMessage('Booking cancelled successfully.');

            bookingsLoaded = false;
            await loadRenterBookings();
            await loadRenterStats();
        } catch (error) {
            console.error('Cancel booking error:', error);
            showErrorMessage(error.message || 'Failed to cancel booking. Please try again.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Yes, Cancel';
            }
        }
    };

    // ============================
    // Message Host (Renter)
    // ============================

    window.openProfileMessageHost = async function(bookingId) {
        const booking = cachedBookings.find(b => String(b.id) === String(bookingId));
        if (!booking) {
            showErrorMessage('Booking not found.');
            return;
        }

        try {
            const token = localStorage.getItem('mr-token');
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';

            // Get or create conversation
            const convoResp = await fetch(`${apiBase}/conversations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ bookingId: booking.id }),
            });
            const convoData = await convoResp.json().catch(() => ({}));

            if (!convoResp.ok || convoData.status !== 'success' || !convoData.conversation) {
                throw new Error(convoData.message || 'Failed to open conversation');
            }

            const conversationId = convoData.conversation.id;

            // Redirect to messages page with conversation id & booking id
            const params = new URLSearchParams();
            params.set('conversationId', conversationId);
            params.set('bookingId', booking.id);
            if (booking.listing.id) params.set('listingId', booking.listing.id);

            // Use relative URL so it works whether site is served via http or file
            window.location.href = `messages.html?${params.toString()}`;
        } catch (error) {
            console.error('Open message host error:', error);
            showErrorMessage(error.message || 'Failed to open chat with host.');
        }
    };

    // Show error message
    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    // Clear error message
    function clearError(elementId) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
    }

    // Show success message
    function showSuccessMessage(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification success';
        toast.innerHTML = `
            <i class="bi bi-check-circle-fill"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Show error message
    function showErrorMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification error';
        toast.innerHTML = `
            <i class="bi bi-exclamation-circle-fill"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Show info message
    function showInfoMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification info';
        toast.innerHTML = `
            <i class="bi bi-info-circle-fill"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Add toast notification styles
    const style = document.createElement('style');
    style.textContent = `
        .toast-notification {
            position: fixed;
            top: 100px;
            right: 20px;
            background: #ffffff;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 10000;
            opacity: 0;
            transform: translateX(400px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-family: 'Inter', sans-serif;
            font-size: 0.9375rem;
            font-weight: 500;
            min-width: 300px;
        }

        .toast-notification.show {
            opacity: 1;
            transform: translateX(0);
        }

        .toast-notification.success {
            border-left: 4px solid var(--success-color);
        }

        .toast-notification.success i {
            color: var(--success-color);
            font-size: 1.25rem;
        }

        .toast-notification.error {
            border-left: 4px solid var(--error-color);
        }

        .toast-notification.error i {
            color: var(--error-color);
            font-size: 1.25rem;
        }

        .toast-notification.info {
            border-left: 4px solid var(--info-color);
        }

        .toast-notification.info i {
            color: var(--info-color);
            font-size: 1.25rem;
        }

        .spinning {
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .owner-booking-actions {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.75rem;
            flex-wrap: wrap;
        }

        .owner-booking-actions .btn {
            font-size: 0.8125rem;
            padding: 0.375rem 0.75rem;
        }
    `;
    document.head.appendChild(style);

    // ====================================
    // TOAST HELPER FUNCTION
    // ====================================
    
    function showToast(message, type = 'info') {
        if (type === 'success') {
            showSuccessMessage(message);
        } else if (type === 'error') {
            showErrorMessage(message);
        } else {
            showInfoMessage(message);
        }
    }

    // ====================================
    // OWNER BOOKING ACTION FUNCTIONS
    // ====================================

    // Accept a pending booking (owner)
    window.ownerAcceptBooking = async function(bookingId) {
        if (!confirm('Accept this booking request?')) return;

        const token = localStorage.getItem('mr-token');
        if (!token) {
            showToast('Please log in', 'error');
            return;
        }

        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/bookings/${bookingId}/accept`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok && data.status === 'success') {
                showToast('Booking accepted successfully!', 'success');
                // Reload owner bookings
                loadOwnerBookings();
                // Reload owner stats
                loadOwnerStats();
            } else {
                throw new Error(data.message || 'Failed to accept booking');
            }
        } catch (error) {
            console.error('Error accepting booking:', error);
            showToast(error.message || 'Failed to accept booking', 'error');
        }
    };

    // Decline a pending booking (owner)
    window.ownerDeclineBooking = async function(bookingId) {
        const reason = prompt('Reason for declining (optional):');
        if (reason === null) return; // User cancelled

        const token = localStorage.getItem('mr-token');
        if (!token) {
            showToast('Please log in', 'error');
            return;
        }

        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/bookings/${bookingId}/decline`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: reason || 'Declined by owner' }),
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok && data.status === 'success') {
                showToast('Booking declined', 'info');
                loadOwnerBookings();
                loadOwnerStats();
            } else {
                throw new Error(data.message || 'Failed to decline booking');
            }
        } catch (error) {
            console.error('Error declining booking:', error);
            showToast(error.message || 'Failed to decline booking', 'error');
        }
    };

    // Cancel a confirmed booking (owner)
    window.ownerCancelBooking = async function(bookingId) {
        const reason = prompt('Reason for cancellation (required):');
        if (!reason) {
            showToast('Cancellation reason is required', 'error');
            return;
        }

        const token = localStorage.getItem('mr-token');
        if (!token) {
            showToast('Please log in', 'error');
            return;
        }

        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/bookings/${bookingId}/cancel-by-owner`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason }),
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok && data.status === 'success') {
                showToast('Booking cancelled', 'info');
                loadOwnerBookings();
                loadOwnerStats();
            } else {
                throw new Error(data.message || 'Failed to cancel booking');
            }
        } catch (error) {
            console.error('Error cancelling booking:', error);
            showToast(error.message || 'Failed to cancel booking', 'error');
        }
    };

    // Mark booking as completed (owner)
    window.ownerCompleteBooking = async function(bookingId) {
        if (!confirm('Mark this booking as completed? This action cannot be undone.')) return;

        const token = localStorage.getItem('mr-token');
        if (!token) {
            showToast('Please log in', 'error');
            return;
        }

        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/bookings/${bookingId}/complete`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok && data.status === 'success') {
                showToast('Booking marked as completed!', 'success');
                loadOwnerBookings();
                loadOwnerStats();
            } else {
                throw new Error(data.message || 'Failed to complete booking');
            }
        } catch (error) {
            console.error('Error completing booking:', error);
            showToast(error.message || 'Failed to complete booking', 'error');
        }
    };

    // Open owner booking details modal
    window.openOwnerBookingDetails = async function(bookingId) {
        const token = localStorage.getItem('mr-token');
        if (!token) {
            showToast('Please log in', 'error');
            return;
        }

        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/bookings/${bookingId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok || data.status !== 'success' || !data.booking) {
                throw new Error(data.message || 'Failed to load booking details');
            }

            const b = data.booking;
            const listing = b.listing || {};
            const renter = b.renter || {};
            const pricing = b.pricing || {};
            const payment = b.payment || {};
            const contact = b.contactInfo || {};

            const checkIn = b.checkIn ? new Date(b.checkIn) : null;
            const checkOut = b.checkOut ? new Date(b.checkOut) : null;
            const dateRange =
                checkIn && checkOut
                    ? `${checkIn.toLocaleDateString()} - ${checkOut.toLocaleDateString()}`
                    : 'Dates TBA';

            const contentEl = document.getElementById('ownerBookingDetailsContent');
            if (!contentEl) return;

            contentEl.innerHTML = `
                <div class="booking-details-section">
                    <h6 class="mb-2 text-muted">Booking</h6>
                    <p class="mb-1"><strong>Booking #:</strong> ${b.bookingNumber}</p>
                    <p class="mb-1"><strong>Status:</strong> ${b.status}</p>
                    <p class="mb-1"><strong>Type:</strong> ${b.bookingType || 'request'}</p>
                    <p class="mb-1"><strong>Dates:</strong> ${dateRange}</p>
                    <p class="mb-3"><strong>Guests:</strong> ${b.guests || 1}</p>

                    <h6 class="mb-2 text-muted">Listing</h6>
                    <p class="mb-1"><strong>Title:</strong> ${listing.title || 'Listing'}</p>
                    <p class="mb-3"><strong>Location:</strong> ${listing.location?.city || ''} ${listing.location?.address ? ' - ' + listing.location.address : ''}</p>

                    <h6 class="mb-2 text-muted">Guest</h6>
                    <p class="mb-1"><strong>Name:</strong> ${renter.name || 'N/A'}</p>
                    <p class="mb-1"><strong>Email:</strong> ${contact.email || renter.email || 'N/A'}</p>
                    <p class="mb-3"><strong>Phone:</strong> ${contact.phone || 'N/A'}</p>

                    <h6 class="mb-2 text-muted">Pricing</h6>
                    <p class="mb-1"><strong>Rate:</strong> Rs ${pricing.rate?.toLocaleString() || 0} / ${pricing.model || 'day'}</p>
                    <p class="mb-1"><strong>Subtotal:</strong> Rs ${pricing.subtotal?.toLocaleString() || 0}</p>
                    <p class="mb-1"><strong>Service fee:</strong> Rs ${pricing.serviceFee?.toLocaleString() || 0}</p>
                    <p class="mb-1"><strong>Deposit:</strong> Rs ${pricing.deposit?.toLocaleString() || 0}</p>
                    <p class="mb-3"><strong>Total:</strong> Rs ${pricing.total?.toLocaleString() || 0}</p>

                    <h6 class="mb-2 text-muted">Payment</h6>
                    <p class="mb-1"><strong>Status:</strong> ${payment.status || 'pending'}</p>
                    <p class="mb-1"><strong>Method:</strong> ${payment.method || 'N/A'}</p>
                    <p class="mb-1"><strong>Paid Amount:</strong> Rs ${payment.paidAmount?.toLocaleString() || 0}</p>
                </div>
            `;

            const modalEl = document.getElementById('ownerBookingDetailsModal');
            if (modalEl && window.bootstrap) {
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
            }
        } catch (error) {
            console.error('Error loading booking details:', error);
            showToast(error.message || 'Failed to load booking details', 'error');
        }
    };

    // Message renter (owner)
    window.ownerMessageRenter = function(renterId, listingId, bookingId) {
        if (!renterId) {
            showToast('Unable to message: renter not found', 'error');
            return;
        }

        // Redirect to messages page with renter and booking context
        const params = new URLSearchParams();
        params.set('userId', renterId);
        if (listingId) params.set('listingId', listingId);
        if (bookingId) params.set('bookingId', bookingId);
        
        window.location.href = `messages.html?${params.toString()}`;
    };

    // ====================================
    // OWNER REVIEW RESPONSE FUNCTIONS
    // ====================================

    // Open respond modal (optionally with existing text for edit)
    window.openRespondModal = function(reviewId, existingText = '') {
        console.log('Opening respond modal for review:', reviewId);
        
        // Ensure modal styles are injected
        ensureReviewModalStyles();
        
        // Remove existing modal if any
        const existing = document.getElementById('respondReviewModal');
        if (existing) existing.remove();
        
        // Create new modal
        const modal = document.createElement('div');
        modal.id = 'respondReviewModal';
        modal.className = 'review-modal-overlay';
        modal.innerHTML = `
            <div class="review-modal">
                <div class="review-modal-header">
                    <h3><i class="bi bi-reply"></i> Respond to Review</h3>
                    <button class="modal-close" onclick="closeRespondModal()">&times;</button>
                </div>
                <div class="review-modal-body">
                    <input type="hidden" id="respond-review-id" value="${reviewId}">
                    <div class="form-group mb-3">
                        <label for="response-text" class="form-label">Your Response</label>
                        <textarea id="response-text" class="form-control" rows="4" 
                            placeholder="Thank the guest or address any concerns..." maxlength="1000">${existingText || ''}</textarea>
                        <small class="text-muted">Max 1000 characters</small>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-outline-secondary" onclick="closeRespondModal()">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="submitReviewResponse()">
                            <i class="bi bi-send"></i> Submit Response
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Focus on textarea
        setTimeout(() => {
            const textarea = document.getElementById('response-text');
            if (textarea) textarea.focus();
        }, 100);
    };

    // Close respond modal
    window.closeRespondModal = function() {
        const modal = document.getElementById('respondReviewModal');
        if (modal) {
            modal.remove();
        }
    };

    // Submit review response
    window.submitReviewResponse = async function() {
        const reviewId = document.getElementById('respond-review-id').value;
        const text = document.getElementById('response-text').value.trim();

        if (!text) {
            showToast('Please enter a response', 'error');
            return;
        }

        const token = localStorage.getItem('mr-token');
        if (!token) {
            showToast('Please log in', 'error');
            return;
        }

        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/reviews/${reviewId}/respond`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ text }),
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok && data.status === 'success') {
                showToast('Response submitted successfully!', 'success');
                closeRespondModal();
                // Reload reviews
                loadOwnerReviews();
            } else {
                throw new Error(data.message || 'Failed to submit response');
            }
        } catch (error) {
            console.error('Error submitting response:', error);
            showToast(error.message || 'Failed to submit response', 'error');
        }
    };

    // Delete existing review response
    window.deleteReviewResponse = async function(reviewId) {
        if (!confirm('Delete your response to this review?')) return;

        const token = localStorage.getItem('mr-token');
        if (!token) {
            showToast('Please log in', 'error');
            return;
        }

        try {
            const apiBase = window.API_BASE_URL || 'http://localhost:4001/api';
            const response = await fetch(`${apiBase}/reviews/${reviewId}/response`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok && data.status === 'success') {
                showToast('Response deleted successfully', 'success');
                loadOwnerReviews();
            } else {
                throw new Error(data.message || 'Failed to delete response');
            }
        } catch (error) {
            console.error('Error deleting response:', error);
            showToast(error.message || 'Failed to delete response', 'error');
        }
    };

    // Helper: format dates as DD/MM/YYYY for owner views
    function formatDateDisplay(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }

    // Add CSS for owner review responses
    const ownerReviewStyles = document.createElement('style');
    ownerReviewStyles.textContent = `
        .owner-response {
            margin-top: 1.5rem;
            padding: 1rem;
            background: #f8f9fa;
            border-left: 3px solid var(--primary-color, #ff385c);
            border-radius: 0 8px 8px 0;
        }

        .owner-response-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
            color: #666;
        }

        .owner-response-header i {
            color: var(--primary-color, #ff385c);
        }

        .owner-response-header .response-date {
            margin-left: auto;
            font-size: 0.75rem;
            color: #999;
        }

        .owner-response-text {
            margin: 0;
            color: #333;
            font-size: 0.9375rem;
            line-height: 1.5;
        }

        .owner-review-actions {
            margin-top: 1rem;
        }
    `;
    document.head.appendChild(ownerReviewStyles);

})();

