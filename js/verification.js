(function() {
    'use strict';

    const API_BASE_URL = 'http://localhost:4001/api';

    document.addEventListener('DOMContentLoaded', async () => {
        // Require login
        if (!window.isLoggedIn || !window.isLoggedIn()) {
            sessionStorage.setItem('redirectAfterLogin', window.location.href);
            window.location.href = 'login.html';
            return;
        }

        await refreshUserState(); // fetch latest user, set UI
        wireEmailVerification();
        wireOtpVerification();
    });

    async function refreshUserState() {
        try {
            const token = localStorage.getItem('mr-token');
            if (!token) throw new Error('No token');
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok || data.status !== 'success') throw new Error(data.message || 'Failed to load user');
            const user = data.user;
            if (window.saveUserToStorage) {
                window.saveUserToStorage(user, user.role || 'renter');
            }
            hydrateUserState(user);
            updateProgress(user);
            return user;
        } catch (err) {
            console.warn('refreshUserState error:', err);
            return null;
        }
    }

    function hydrateUserState(user) {
        const u = user || (window.getCurrentUser && window.getCurrentUser());
        if (!u) return;
        const nameEls = document.querySelectorAll('.user-name');
        const emailEls = document.querySelectorAll('.user-email');
        nameEls.forEach(el => el.textContent = u.name || 'User');
        emailEls.forEach(el => el.textContent = u.email || '');
    }

    function updateProgress(user) {
        const emailStep = document.getElementById('emailStep');
        const phoneStep = document.getElementById('phoneStep');
        const emailStatus = document.getElementById('emailStatus');
        const otpStatus = document.getElementById('otpStatus');

        const emailVerified = user?.verificationStatus?.email;
        const phoneVerified = user?.verificationStatus?.phone;

        if (emailStep) {
            emailStep.classList.toggle('completed', !!emailVerified);
        }
        if (phoneStep) {
            phoneStep.classList.toggle('completed', !!phoneVerified);
        }
        if (emailStatus) {
            emailStatus.textContent = emailVerified ? 'Email verified' : 'Send and verify email';
            emailStatus.className = emailVerified ? 'text-success' : 'text-muted';
        }
        if (otpStatus) {
            otpStatus.textContent = phoneVerified ? 'Phone verified' : 'Send and verify OTP';
            otpStatus.className = phoneVerified ? 'text-success' : 'text-muted';
        }
    }

    function wireEmailVerification() {
        const sendEmailBtn = document.getElementById('sendEmailVerification');
        const verifyEmailBtn = document.getElementById('verifyEmailBtn');
        const emailTokenInput = document.getElementById('emailToken');
        const emailStatus = document.getElementById('emailStatus');

        if (sendEmailBtn) {
            sendEmailBtn.addEventListener('click', async () => {
                const res = await authPost('/auth/send-verification-email');
                if (res.success) {
                    showStatus(emailStatus, 'Email verification sent', 'success');
                    // Dev-only: auto-fill token if returned
                    if (res.data?.token && emailTokenInput) {
                        emailTokenInput.value = res.data.token;
                    }
                } else {
                    showStatus(emailStatus, res.error || 'Failed to send verification email', 'error');
                }
            });
        }

        if (verifyEmailBtn && emailTokenInput) {
            verifyEmailBtn.addEventListener('click', async () => {
                const token = emailTokenInput.value.trim();
                if (!token) {
                    showStatus(emailStatus, 'Enter verification token', 'error');
                    return;
                }
                const res = await postJson('/auth/verify-email', { token });
                if (res.success) {
                    showStatus(emailStatus, 'Email verified', 'success');
                    await refreshUserState();
                } else {
                    showStatus(emailStatus, res.error || 'Verification failed', 'error');
                }
            });
        }
    }

    function wireOtpVerification() {
        const sendOtpBtn = document.getElementById('sendOtpBtn');
        const verifyOtpBtn = document.getElementById('verifyOtpBtn');
        const otpInput = document.getElementById('otpCode');
        const otpStatus = document.getElementById('otpStatus');

        if (sendOtpBtn) {
            sendOtpBtn.addEventListener('click', async () => {
                const res = await authPost('/auth/send-otp');
                if (res.success) {
                    showStatus(otpStatus, 'OTP sent to your phone', 'success');
                    // Dev-only: auto-fill OTP if returned
                    if (res.data?.otp && otpInput) {
                        otpInput.value = res.data.otp;
                    }
                } else {
                    showStatus(otpStatus, res.error || 'Failed to send OTP', 'error');
                }
            });
        }

        if (verifyOtpBtn && otpInput) {
            verifyOtpBtn.addEventListener('click', async () => {
                const otp = otpInput.value.trim();
                if (!otp) {
                    showStatus(otpStatus, 'Enter OTP', 'error');
                    return;
                }
                const res = await authPost('/auth/verify-otp', { otp });
                if (res.success) {
                    showStatus(otpStatus, 'Phone verified', 'success');
                    await refreshUserState();
                } else {
                    showStatus(otpStatus, res.error || 'OTP verification failed', 'error');
                }
            });
        }
    }

    async function authPost(path, body = {}) {
        const token = localStorage.getItem('mr-token');
        if (!token) return { success: false, error: 'Not logged in' };
        return postJson(path, body, token);
    }

    async function postJson(path, body, token) {
        try {
            const res = await fetch(`${API_BASE_URL}${path}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(body || {})
            });
            const data = await res.json();
            if (!res.ok || data.status !== 'success') {
                return { success: false, error: data.message || 'Request failed', data };
            }
            return { success: true, data };
        } catch (err) {
            console.error('postJson error', err);
            return { success: false, error: 'Network error' };
        }
    }

    function showStatus(el, message, type) {
        if (!el) return;
        el.textContent = message;
        el.classList.remove('text-success', 'text-danger', 'text-muted');
        if (type === 'success') el.classList.add('text-success');
        else if (type === 'error') el.classList.add('text-danger');
        else el.classList.add('text-muted');
    }
})();
// Verification Page Functionality
// Multi-step verification workflow

(function() {
    'use strict';

    let currentStep = 'id';
    let verificationData = {
        id: { status: 'pending', data: null },
        biometric: { status: 'pending', data: null },
        face: { status: 'pending', data: null }
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initVerification();
        console.log('✅ Verification page initialized');
    });

    // Initialize verification page
    function initVerification() {
        // Load existing verification status
        loadVerificationStatus();
    }

    // Load verification status (simulate API call)
    function loadVerificationStatus() {
        // In production, fetch from API:
        // fetch('/api/verification/status')
        //     .then(response => response.json())
        //     .then(data => {
        //         verificationData = data;
        //         updateVerificationStatus();
        //     })
        //     .catch(error => {
        //         console.error('Error loading verification status:', error);
        //     });

        // Demo: Check if any step is already completed
        // For demo, all are pending
    }

    // Handle ID verification
    window.handleIDVerification = function(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const idType = formData.get('idType');
        const idNumber = formData.get('idNumber');
        const idDocument = document.getElementById('idDocument').files[0];

        if (!idDocument) {
            alert('Please upload your ID document');
            return;
        }

        const submitBtn = document.getElementById('idVerifyBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-arrow-repeat spinning"></i> Verifying...';
        }

        // Update status
        const statusElement = document.getElementById('idStatus');
        if (statusElement) {
            statusElement.innerHTML = '<span class="status-badge verifying">Verifying...</span>';
        }

        // Simulate API call
        setTimeout(() => {
            // In production, make actual API call:
            // fetch('/api/verification/id', {
            //     method: 'POST',
            //     body: formData
            // })
            // .then(response => response.json())
            // .then(data => {
            //     if (data.success) {
            //         verificationData.id.status = 'verified';
            //         updateVerificationStatus();
            //         goToStep('biometric');
            //     } else {
            //         verificationData.id.status = 'failed';
            //         updateVerificationStatus();
            //         alert(data.message || 'Verification failed. Please try again.');
            //     }
            //     if (submitBtn) {
            //         submitBtn.disabled = false;
            //         submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Submit for Verification';
            //     }
            // })
            // .catch(error => {
            //     console.error('Verification error:', error);
            //     alert('An error occurred. Please try again.');
            //     if (submitBtn) {
            //         submitBtn.disabled = false;
            //         submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Submit for Verification';
            //     }
            // });

            // Demo: Success
            verificationData.id.status = 'verified';
            if (statusElement) {
                statusElement.innerHTML = '<span class="status-badge verified"><i class="bi bi-check-circle"></i> Verified</span>';
            }
            
            // Mark step as completed
            const stepElement = document.getElementById('idVerificationStep');
            if (stepElement) {
                stepElement.classList.remove('active');
                stepElement.classList.add('completed');
                stepElement.querySelector('.step-icon').innerHTML = '<i class="bi bi-check-circle-fill"></i>';
            }

            // Move to next step
            setTimeout(() => {
                goToStep('biometric');
            }, 1000);
        }, 2000);
    };

    // Handle ID upload
    window.handleIDUpload = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('File size must be less than 5MB');
            return;
        }

        const uploadedFile = document.getElementById('idUploadedFile');
        const uploadArea = document.getElementById('idUploadArea');
        
        if (uploadedFile && uploadArea) {
            uploadedFile.style.display = 'block';
            uploadedFile.innerHTML = `
                <div class="uploaded-file-info">
                    <div class="uploaded-file-icon">
                        <i class="bi bi-file-earmark-image"></i>
                    </div>
                    <div class="uploaded-file-details">
                        <div class="uploaded-file-name">${file.name}</div>
                        <div class="uploaded-file-size">${formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button type="button" class="btn-remove-file" onclick="removeIDFile()">
                    <i class="bi bi-x-lg"></i>
                </button>
            `;
            
            uploadArea.querySelector('.upload-placeholder').style.display = 'none';
        }
    };

    // Remove ID file
    window.removeIDFile = function() {
        const uploadedFile = document.getElementById('idUploadedFile');
        const uploadArea = document.getElementById('idUploadArea');
        const fileInput = document.getElementById('idDocument');
        
        if (uploadedFile) uploadedFile.style.display = 'none';
        if (uploadArea) uploadArea.querySelector('.upload-placeholder').style.display = 'block';
        if (fileInput) fileInput.value = '';
    };

    // Start biometric scan
    window.startBiometricScan = function() {
        const btn = event.target.closest('.btn-scan');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="bi bi-arrow-repeat spinning"></i> Scanning...';
        }

        const statusElement = document.getElementById('biometricStatus');
        if (statusElement) {
            statusElement.innerHTML = '<span class="status-badge verifying">Scanning...</span>';
        }

        // Simulate biometric scan
        setTimeout(() => {
            // In production, use WebAuthn API or device fingerprint scanner:
            // navigator.credentials.get({
            //     publicKey: {
            //         challenge: new Uint8Array(32),
            //         allowCredentials: [],
            //         userVerification: 'required'
            //     }
            // })
            // .then(credential => {
            //     // Process biometric data
            //     verificationData.biometric.status = 'verified';
            //     updateVerificationStatus();
            //     goToStep('face');
            // })
            // .catch(error => {
            //     console.error('Biometric scan error:', error);
            //     alert('Biometric scan failed. Please try again.');
            //     if (btn) {
            //         btn.disabled = false;
            //         btn.innerHTML = '<i class="bi bi-fingerprint"></i> Start Fingerprint Scan';
            //     }
            // });

            // Demo: Success
            verificationData.biometric.status = 'verified';
            if (statusElement) {
                statusElement.innerHTML = '<span class="status-badge verified"><i class="bi bi-check-circle"></i> Verified</span>';
            }

            // Mark step as completed
            const stepElement = document.getElementById('biometricVerificationStep');
            if (stepElement) {
                stepElement.classList.remove('active');
                stepElement.classList.add('completed');
                stepElement.querySelector('.step-icon').innerHTML = '<i class="bi bi-check-circle-fill"></i>';
            }

            // Move to next step
            setTimeout(() => {
                goToStep('face');
            }, 1000);
        }, 3000);
    };

    // Start face scan
    window.startFaceScan = function() {
        const btn = event.target.closest('.btn-scan');
        const video = document.getElementById('videoStream');
        const preview = document.getElementById('cameraPreview');
        const placeholder = preview?.querySelector('.camera-placeholder');

        // Request camera access
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                if (video) {
                    video.srcObject = stream;
                    video.style.display = 'block';
                    if (placeholder) placeholder.style.display = 'none';
                }

                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="bi bi-camera-fill"></i> Scanning Face...';
                }

                const statusElement = document.getElementById('faceStatus');
                if (statusElement) {
                    statusElement.innerHTML = '<span class="status-badge verifying">Scanning...</span>';
                }

                // Simulate face recognition (in production, use face recognition API)
                setTimeout(() => {
                    // Stop camera
                    stream.getTracks().forEach(track => track.stop());
                    if (video) {
                        video.style.display = 'none';
                        if (placeholder) placeholder.style.display = 'flex';
                    }

                    // In production, send captured image to face recognition API:
                    // const canvas = document.getElementById('captureCanvas');
                    // const context = canvas.getContext('2d');
                    // canvas.width = video.videoWidth;
                    // canvas.height = video.videoHeight;
                    // context.drawImage(video, 0, 0);
                    // canvas.toBlob(blob => {
                    //     const formData = new FormData();
                    //     formData.append('faceImage', blob);
                    //     fetch('/api/verification/face', {
                    //         method: 'POST',
                    //         body: formData
                    //     })
                    //     .then(response => response.json())
                    //     .then(data => {
                    //         if (data.success) {
                    //             verificationData.face.status = 'verified';
                    //             completeVerification();
                    //         } else {
                    //             alert(data.message || 'Face verification failed');
                    //         }
                    //     });
                    // });

                    // Demo: Success
                    verificationData.face.status = 'verified';
                    if (statusElement) {
                        statusElement.innerHTML = '<span class="status-badge verified"><i class="bi bi-check-circle"></i> Verified</span>';
                    }

                    // Mark step as completed
                    const stepElement = document.getElementById('faceVerificationStep');
                    if (stepElement) {
                        stepElement.classList.remove('active');
                        stepElement.classList.add('completed');
                        stepElement.querySelector('.step-icon').innerHTML = '<i class="bi bi-check-circle-fill"></i>';
                    }

                    // Complete verification
                    setTimeout(() => {
                        completeVerification();
                    }, 1000);
                }, 3000);
            })
            .catch(error => {
                console.error('Camera access error:', error);
                alert('Camera access is required for face verification. Please allow camera access and try again.');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="bi bi-camera-fill"></i> Start Face Scan';
                }
            });
    };

    // Go to step
    window.goToStep = function(step) {
        // Hide all cards
        document.querySelectorAll('.verification-step-card').forEach(card => {
            card.style.display = 'none';
            card.classList.remove('active');
        });

        // Show selected card
        const cardId = step === 'id' ? 'idVerificationCard' : 
                      step === 'biometric' ? 'biometricVerificationCard' : 
                      'faceVerificationCard';
        const card = document.getElementById(cardId);
        if (card) {
            card.style.display = 'block';
            card.classList.add('active');
        }

        // Update progress
        const stepId = step === 'id' ? 'idVerificationStep' : 
                      step === 'biometric' ? 'biometricVerificationStep' : 
                      'faceVerificationStep';
        const stepElement = document.getElementById(stepId);
        if (stepElement) {
            stepElement.classList.add('active');
        }

        currentStep = step;
    };

    // Complete verification
    function completeVerification() {
        // Hide all cards
        document.querySelectorAll('.verification-step-card').forEach(card => {
            card.style.display = 'none';
        });

        // Show completion card
        const completeCard = document.getElementById('verificationComplete');
        if (completeCard) {
            completeCard.style.display = 'block';
        }

        // In production, update user verification status:
        // fetch('/api/verification/complete', {
        //     method: 'POST'
        // })
        // .then(response => response.json())
        // .then(data => {
        //     if (data.success) {
        //         // Verification complete
        //     }
        // });
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Add spinning animation
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

