// Subscription and Payment Management
(function() {
    'use strict';
    
    const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';
    let selectedPlan = null;
    let selectedPlanData = null;
    
    // Select subscription plan
    window.selectPlan = function(plan, amount, currency) {
        selectedPlan = plan;
        selectedPlanData = { plan, amount, currency };
        
        // Show payment section
        document.getElementById('payment-section').style.display = 'block';
        document.getElementById('selected-plan-name').textContent = 
            plan === 'monthly_pkr' ? 'Premium (Pakistan) - Rs. 500/month' : 'Premium (International) - $7.99/month';
        document.getElementById('summary-plan').textContent = 
            plan === 'monthly_pkr' ? 'Premium (Pakistan)' : 'Premium (International)';
        document.getElementById('summary-amount').textContent = 
            currency === 'PKR' ? `Rs. ${amount}` : `$${amount}`;
        document.getElementById('summary-total').textContent = 
            currency === 'PKR' ? `Rs. ${amount}` : `$${amount}`;
        
        // Scroll to payment section
        document.getElementById('payment-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    
    // Cancel payment
    window.cancelPayment = function() {
        document.getElementById('payment-section').style.display = 'none';
        selectedPlan = null;
        selectedPlanData = null;
    };
    
    // Handle payment method change
    document.addEventListener('DOMContentLoaded', function() {
        const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
        paymentMethods.forEach(method => {
            method.addEventListener('change', function() {
                const value = this.value;
                
                // Hide all forms
                document.getElementById('card-payment-form').style.display = 'none';
                document.getElementById('jazzcash-payment-form').style.display = 'none';
                document.getElementById('easypaisa-payment-form').style.display = 'none';
                
                // Show selected form
                if (value === 'card') {
                    document.getElementById('card-payment-form').style.display = 'block';
                } else if (value === 'jazzcash') {
                    document.getElementById('jazzcash-payment-form').style.display = 'block';
                } else if (value === 'easypaisa') {
                    document.getElementById('easypaisa-payment-form').style.display = 'block';
                }
            });
        });
        
        // Format card number
        const cardNumberInput = document.getElementById('cardNumber');
        if (cardNumberInput) {
            cardNumberInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\s/g, '');
                let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
                e.target.value = formattedValue;
            });
        }
        
        // Format expiry date
        const cardExpiryInput = document.getElementById('cardExpiry');
        if (cardExpiryInput) {
            cardExpiryInput.addEventListener('input', function(e) {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
            });
        }
    });
    
    // Process payment
    window.processPayment = async function() {
        try {
            const token = localStorage.getItem('mr-token');
            if (!token) {
                alert('Please login to continue');
                window.location.href = 'login.html';
                return;
            }
            
            if (!selectedPlan) {
                alert('Please select a plan first');
                return;
            }
            
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
            if (!paymentMethod) {
                alert('Please select a payment method');
                return;
            }
            
            // Collect payment data
            const paymentData = {
                plan: selectedPlan,
                paymentMethod: paymentMethod
            };
            
            if (paymentMethod === 'card') {
                paymentData.cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
                paymentData.cardExpiry = document.getElementById('cardExpiry').value;
                paymentData.cardCVV = document.getElementById('cardCVV').value;
                paymentData.cardName = document.getElementById('cardName').value;
                
                if (!paymentData.cardNumber || !paymentData.cardExpiry || !paymentData.cardCVV || !paymentData.cardName) {
                    alert('Please fill in all card details');
                    return;
                }
            } else if (paymentMethod === 'jazzcash') {
                paymentData.jazzcashNumber = document.getElementById('jazzcashNumber').value;
                paymentData.jazzcashPin = document.getElementById('jazzcashPin').value;
                
                if (!paymentData.jazzcashNumber || !paymentData.jazzcashPin) {
                    alert('Please fill in JazzCash account number and PIN');
                    return;
                }
            } else if (paymentMethod === 'easypaisa') {
                paymentData.easypaisaNumber = document.getElementById('easypaisaNumber').value;
                paymentData.easypaisaPin = document.getElementById('easypaisaPin').value;
                
                if (!paymentData.easypaisaNumber || !paymentData.easypaisaPin) {
                    alert('Please fill in Easypaisa account number and PIN');
                    return;
                }
            }
            
            // Disable submit button
            const submitBtn = event.target;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
            
            // Process payment
            const response = await fetch(`${API_BASE_URL}/subscriptions/payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(paymentData)
            });
            
            const data = await response.json();
            
            if (response.ok && data.status === 'success') {
                // Success - redirect to success page
                alert('Payment successful! Your subscription is now active.');
                window.location.href = 'profile.html';
            } else {
                // Error
                alert(data.message || 'Payment failed. Please try again.');
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="bi bi-lock-fill"></i> Complete Payment';
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('An error occurred. Please try again.');
            const submitBtn = event.target;
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-lock-fill"></i> Complete Payment';
        }
    };
    
    // Check current subscription status on load
    document.addEventListener('DOMContentLoaded', async function() {
        try {
            const token = localStorage.getItem('mr-token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }
            
            const response = await fetch(`${API_BASE_URL}/subscriptions/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.data && data.data.subscriptionActive) {
                    // User already has active subscription
                    document.querySelector('.subscription-page').innerHTML = `
                        <div class="container text-center py-5">
                            <div class="alert alert-success">
                                <h4>You already have an active subscription!</h4>
                                <p>Your premium account is active until ${new Date(data.data.subscription.endDate).toLocaleDateString()}</p>
                                <a href="profile.html" class="btn btn-primary">Go to Profile</a>
                            </div>
                        </div>
                    `;
                }
            }
        } catch (error) {
            console.error('Error checking subscription:', error);
        }
    });
})();

