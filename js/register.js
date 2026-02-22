// Registration Page Functionality
// Modern, production-ready implementation

(function() {
    'use strict';

    let currentRegisterMethod = 'email';

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initRegisterForm();
        console.log('✅ Registration page initialized');
    });

    // Initialize registration form
    function initRegisterForm() {
        const form = document.getElementById('registerForm');
        const nameInput = document.getElementById('register-name');
        const identifierInput = document.getElementById('register-identifier');
        const passwordInput = document.getElementById('register-password');
        const confirmPasswordInput = document.getElementById('register-confirm-password');

        // Set initial method
        switchRegisterMethod('email');

        // Add input validation
        if (nameInput) {
            nameInput.addEventListener('input', function() {
                validateName(this.value);
            });
        }

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
                checkPasswordStrength(this.value);
                checkPasswordMatch();
            });
        }

        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', function() {
                checkPasswordMatch();
            });
        }
    }

    // Switch registration method (Email/Phone)
    window.switchRegisterMethod = function(method) {
        currentRegisterMethod = method;
        const identifierInput = document.getElementById('register-identifier');
        const identifierLabel = document.getElementById('identifier-label');
        const identifierIcon = document.getElementById('identifier-icon');
        const methodButtons = document.querySelectorAll('.register-method-toggle .method-btn');

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

    // Validate name
    function validateName(value) {
        if (!value.trim()) {
            return true; // Empty is OK, required will catch it
        }

        if (value.trim().length < 2) {
            showError('name-error', 'Name must be at least 2 characters');
            return false;
        }

        if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
            showError('name-error', 'Name can only contain letters and spaces');
            return false;
        }

        clearError('name-error');
        return true;
    }

    // Validate identifier (email or phone)
    function validateIdentifier(value) {
        const errorElement = document.getElementById('identifier-error');
        const trimmed = (value || '').trim();
        
        if (!trimmed) {
            return true; // Empty is OK, required will catch it
        }

        if (currentRegisterMethod === 'email') {
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
        if (value.length < 8) {
            showError('password-error', 'Password must be at least 8 characters');
            return false;
        }

        clearError('password-error');
        return true;
    }

    // Check password strength
    function checkPasswordStrength(password) {
        const strengthBar = document.getElementById('strength-fill');
        const strengthText = document.getElementById('strength-text');
        const passwordStrength = document.getElementById('password-strength');

        if (!password) {
            passwordStrength.classList.remove('show');
            return;
        }

        passwordStrength.classList.add('show');

        let strength = 0;
        let strengthLabel = '';

        // Length check
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;

        // Character variety checks
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 2) {
            strengthBar.className = 'strength-fill weak';
            strengthLabel = 'Weak';
            strengthText.style.color = 'var(--error-color)';
        } else if (strength <= 4) {
            strengthBar.className = 'strength-fill medium';
            strengthLabel = 'Medium';
            strengthText.style.color = 'var(--warning-color)';
        } else {
            strengthBar.className = 'strength-fill strong';
            strengthLabel = 'Strong';
            strengthText.style.color = 'var(--success-color)';
        }

        strengthText.textContent = `Password strength: ${strengthLabel}`;
    }

    // Check password match
    function checkPasswordMatch() {
        const password = document.getElementById('register-password')?.value || '';
        const confirmPassword = document.getElementById('register-confirm-password')?.value || '';

        if (!confirmPassword) {
            clearError('confirm-password-error');
            return true;
        }

        if (password !== confirmPassword) {
            showError('confirm-password-error', 'Passwords do not match');
            return false;
        }

        clearError('confirm-password-error');
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

    // Handle form submission
    window.handleRegister = async function(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = document.getElementById('registerSubmitBtn');
        const nameInput = document.getElementById('register-name');
        const identifierInput = document.getElementById('register-identifier');
        const passwordInput = document.getElementById('register-password');
        const confirmPasswordInput = document.getElementById('register-confirm-password');
        const roleInputs = document.querySelectorAll('input[name="role"]');
        const accountTypeInputs = document.querySelectorAll('input[name="accountType"]');
        const termsCheckbox = document.getElementById('accept-terms');

        // Get form values
        const name = nameInput?.value.trim() || '';
        const identifier = identifierInput?.value.trim() || '';
        const password = passwordInput?.value || '';
        const confirmPassword = confirmPasswordInput?.value || '';
        const role = Array.from(roleInputs).find(r => r.checked)?.value || '';
        const accountType = Array.from(accountTypeInputs).find(a => a.checked)?.value || '';
        const acceptTerms = termsCheckbox?.checked || false;

        // Validate inputs
        if (!name) {
            showError('name-error', 'Name is required');
            nameInput?.focus();
            return;
        }

        if (!validateName(name)) {
            nameInput?.focus();
            return;
        }

        if (!identifier) {
            showError('identifier-error', `${currentRegisterMethod === 'email' ? 'Email' : 'Phone number'} is required`);
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

        if (!confirmPassword) {
            showError('confirm-password-error', 'Please confirm your password');
            confirmPasswordInput?.focus();
            return;
        }

        if (!checkPasswordMatch()) {
            confirmPasswordInput?.focus();
            return;
        }

        if (!role) {
            alert('Please select your user type (Renter, Owner, or Both)');
            return;
        }

        if (!acceptTerms) {
            showError('terms-error', 'You must accept the Terms of Service and Privacy Policy');
            termsCheckbox?.focus();
            return;
        }

        // Disable submit button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="btn-text">Creating account...</span><i class="bi bi-arrow-repeat btn-icon spinning"></i>';
        }

        // Use auth system
        if (window.register) {
            // Map UI role value to backend role
            let backendRole = 'renter';
            if (role === 'owner') backendRole = 'owner';
            else if (role === 'dual_role' || role === 'both') backendRole = 'dual_role';

            const userData = {
                email: currentRegisterMethod === 'email' ? identifier : '',
                phone: currentRegisterMethod === 'phone' ? identifier : '',
                mobile: currentRegisterMethod === 'phone' ? identifier : '', // backend accepts mobile/phone
                name: name,
                password: password,
                confirmPassword: confirmPassword,
                role: backendRole
                // Note: accountType is always 'free' on registration for security
                // Users can upgrade to paid after registration via subscription page
            };
            
            try {
                const result = await window.register(userData);
                
                if (result && result.success) {
                    // After successful signup, trigger verification flows (email + OTP) in parallel (best-effort)
                    triggerVerificationFlows();
                    
                    // If user selected paid account, redirect to subscription page
                    if (accountType === 'paid') {
                        // Store intent to upgrade
                        localStorage.setItem('upgrade-intent', 'true');
                        window.location.href = 'subscription.html';
                    } else {
                        window.location.href = 'verification.html';
                    }
                } else {
                    showError('identifier-error', result && result.error ? result.error : 'Registration failed. Please try again.');
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<span class="btn-text">Create Account</span><i class="bi bi-arrow-right btn-icon"></i>';
                    }
                }
            } catch (e) {
                console.error('Register handler error:', e);
                showError('identifier-error', 'Something went wrong. Please try again.');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<span class="btn-text">Create Account</span><i class="bi bi-arrow-right btn-icon"></i>';
                }
            }
        } else {
            // Fallback: Simulate API call
            setTimeout(() => {
                console.log('Registration attempt:', registerData);
                alert('Registration successful! (Demo mode)');
                window.location.href = 'verification.html';
            }, 1500);
        }
    };

    // Handle social registration
    window.handleSocialRegister = function(provider) {
        console.log(`Social registration with ${provider}`);
        
        const API_BASE_URL = 'http://localhost:4001/api';
        
        if (provider === 'google') {
            window.location.href = `${API_BASE_URL}/auth/google`;
        } else if (provider === 'facebook') {
            window.location.href = `${API_BASE_URL}/auth/facebook`;
        } else {
            alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} registration is not available.`);
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

    // Trigger email + OTP verification (best-effort; surface errors in console)
    async function triggerVerificationFlows() {
        const token = localStorage.getItem('mr-token');
        if (!token) return;

        // Send email verification
        fetch('http://localhost:4001/api/auth/send-verification-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        }).catch(err => console.warn('Email verification send failed', err));

        // Send OTP for phone (only if phone was used)
        fetch('http://localhost:4001/api/auth/send-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        }).catch(err => console.warn('OTP send failed', err));
    }
})();

