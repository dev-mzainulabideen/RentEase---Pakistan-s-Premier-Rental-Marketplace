// Login Page Functionality
// Modern, production-ready implementation

(function() {
    'use strict';

    let currentLoginMethod = 'email';

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initLoginForm();
        console.log('✅ Login page initialized');
    });

    // Initialize login form
    function initLoginForm() {
        const form = document.getElementById('loginForm');
        const identifierInput = document.getElementById('login-identifier');
        const passwordInput = document.getElementById('login-password');

        // Set initial method
        switchLoginMethod('email');

        // Add input validation
        if (identifierInput) {
            identifierInput.addEventListener('input', function() {
                validateIdentifier(this.value);
            });

            identifierInput.addEventListener('blur', function() {
                validateIdentifier(this.value);
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', function() {
                validatePassword(this.value);
            });
        }
    }

    // Switch login method (Email/Phone)
    window.switchLoginMethod = function(method) {
        currentLoginMethod = method;
        const identifierInput = document.getElementById('login-identifier');
        const identifierLabel = document.getElementById('identifier-label');
        const identifierIcon = document.getElementById('identifier-icon');
        const methodButtons = document.querySelectorAll('.method-btn');

        // Update active button
        methodButtons.forEach(btn => {
            if (btn.dataset.method === method) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update input field
        if (identifierInput) {
            if (method === 'email') {
                identifierInput.type = 'text';
                identifierInput.placeholder = 'Enter your email';
                identifierInput.autocomplete = 'email';
                identifierInput.setAttribute('inputmode', 'email');
                
                if (identifierLabel) {
                    identifierLabel.textContent = 'Email Address';
                }
                
                if (identifierIcon) {
                    identifierIcon.className = 'bi bi-envelope';
                }
            } else {
                identifierInput.type = 'tel';
                identifierInput.placeholder = 'Enter your phone number';
                identifierInput.autocomplete = 'tel';
                identifierInput.setAttribute('inputmode', 'tel');
                
                if (identifierLabel) {
                    identifierLabel.textContent = 'Phone Number';
                }
                
                if (identifierIcon) {
                    identifierIcon.className = 'bi bi-phone';
                }
            }

            // Clear validation
            clearError('identifier-error');
            identifierInput.value = '';
        }
    };

    // Validate identifier (email or phone)
    function validateIdentifier(value) {
        const errorElement = document.getElementById('identifier-error');
        const trimmed = (value || '').trim();
        
        if (!trimmed) {
            return true; // Empty is OK, required will catch it
        }

        if (currentLoginMethod === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmed)) {
                showError('identifier-error', 'Please enter a valid email address');
                return false;
            }
        } else {
            // Phone validation (Pakistani format: +92XXXXXXXXXX or 03XXXXXXXXX)
            const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
            const cleanPhone = trimmed.replace(/[\s-]/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                showError('identifier-error', 'Please enter a valid phone number');
                return false;
            }
        }

        clearError('identifier-error');
        return true;
    }

    // Validate password
    function validatePassword(value) {
        if (value.length < 6) {
            showError('password-error', 'Password must be at least 6 characters');
            return false;
        }

        clearError('password-error');
        return true;
    }

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

    // Toggle password visibility
    window.togglePasswordVisibility = function() {
        const passwordInput = document.getElementById('login-password');
        const passwordEye = document.getElementById('password-eye');

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

    // Handle form submission
    window.handleLogin = async function(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = document.getElementById('loginSubmitBtn');
        const identifierInput = document.getElementById('login-identifier');
        const passwordInput = document.getElementById('login-password');
        const rememberMe = document.getElementById('remember-me');

        // Get form values
        const identifier = identifierInput?.value.trim() || '';
        const password = passwordInput?.value || '';
        const remember = rememberMe?.checked || false;

        // Validate inputs
        if (!identifier) {
            showError('identifier-error', `${currentLoginMethod === 'email' ? 'Email' : 'Phone number'} is required`);
            identifierInput?.focus();
            return;
        }

        if (!validateIdentifier(identifier)) {
            identifierInput?.focus();
            return;
        }

        if (!password) {
            showError('password-error', 'Password is required');
            passwordInput?.focus();
            return;
        }

        if (!validatePassword(password)) {
            passwordInput?.focus();
            return;
        }

        // Disable submit button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="btn-text">Logging in...</span><i class="bi bi-arrow-repeat btn-icon spinning"></i>';
        }

        // Prepare login data
        const loginData = {
            method: currentLoginMethod,
            identifier: identifier,
            password: password,
            remember: remember
        };

        // Use auth system
        if (window.login) {
            try {
                const email = identifier; // Backend login currently supports email
                const result = await window.login(email, password, remember);
                
                if (result && result.success) {
                    // Check for redirect destination
                    const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
                    sessionStorage.removeItem('redirectAfterLogin');
                    
                    // Redirect based on role
                    if (result.role === 'admin') {
                        window.location.href = 'admin/dashboard.html';
                    } else {
                        window.location.href = redirectUrl;
                    }
                    return;
                }

                showError('password-error', result && result.error ? result.error : 'Invalid credentials. Please try again.');
            } catch (e) {
                console.error('Login handler error:', e);
                showError('password-error', 'Something went wrong. Please try again.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span class="btn-text">Log in</span><i class="bi bi-arrow-right btn-icon"></i>';
                }
            }
        } else {
            // Fallback: Simulate API call (replace with actual API call)
            setTimeout(() => {
                console.log('Login attempt:', loginData);
                alert('Login successful! (Demo mode - replace with actual API call)');
                // Check for redirect destination
                const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || 'index.html';
                sessionStorage.removeItem('redirectAfterLogin');
                
                window.location.href = redirectUrl;
            }, 1500);
        }
    };

    // Handle social login
    window.handleSocialLogin = function(provider) {
        console.log(`Social login with ${provider}`);
        
        const API_BASE_URL = 'http://localhost:4001/api';
        
        if (provider === 'google') {
            window.location.href = `${API_BASE_URL}/auth/google`;
        } else if (provider === 'facebook') {
            window.location.href = `${API_BASE_URL}/auth/facebook`;
        } else {
            alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not available.`);
        }
    };

    // Add spinning animation for loading state
    const style = document.createElement('style');
    style.textContent = `
        .spinning {
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

})();

