// Emergency Contacts Management
(function() {
    'use strict';

    const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';
    let emergencyContacts = [];
    let currentFilter = 'all';
    let userBookings = [];

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🚨 Emergency Contacts page initialized');
        
        // Check authentication
        if (!window.isLoggedIn || !window.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }

        initEmergencyContacts();
    });

    // Initialize emergency contacts page
    function initEmergencyContacts() {
        // Load user bookings for the form
        loadUserBookings();

        // Load emergency contacts
        loadEmergencyContacts();

        // Load statistics
        loadStatistics();

        // Setup event listeners
        setupEventListeners();
    }

    // Setup event listeners
    function setupEventListeners() {
        // New emergency button
        const newEmergencyBtn = document.getElementById('newEmergencyBtn');
        if (newEmergencyBtn) {
            newEmergencyBtn.addEventListener('click', function() {
                openEmergencyModal();
            });
        }

        // Emergency form submission
        const emergencyForm = document.getElementById('emergencyForm');
        if (emergencyForm) {
            emergencyForm.addEventListener('submit', handleEmergencySubmit);
        }

        // Filter buttons
        const filterButtons = document.querySelectorAll('[data-filter]');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const filter = this.getAttribute('data-filter');
                setFilter(filter);
            });
        });

        // Auto-update priority based on emergency type
        const emergencyTypeSelect = document.getElementById('emergencyType');
        if (emergencyTypeSelect) {
            emergencyTypeSelect.addEventListener('change', function() {
                updatePriorityBasedOnType(this.value);
            });
        }
    }

    // Load user bookings for the form
    async function loadUserBookings() {
        try {
            const token = localStorage.getItem('mr-token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && Array.isArray(data.bookings)) {
                    userBookings = data.bookings.filter(b => 
                        b.status === 'confirmed' || 
                        b.status === 'completed' || 
                        b.status === 'pending'
                    );
                    populateBookingSelect();
                }
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
        }
    }

    // Populate booking select in form
    function populateBookingSelect() {
        const bookingSelect = document.getElementById('bookingId');
        if (!bookingSelect) return;

        // Clear existing options except first
        bookingSelect.innerHTML = '<option value="">No related booking</option>';

        userBookings.forEach(booking => {
            const option = document.createElement('option');
            option.value = booking._id || booking.id;
            const checkIn = new Date(booking.checkIn).toLocaleDateString();
            const checkOut = new Date(booking.checkOut).toLocaleDateString();
            option.textContent = `${booking.bookingNumber} - ${checkIn} to ${checkOut}`;
            bookingSelect.appendChild(option);
        });
    }

    // Update priority based on emergency type
    function updatePriorityBasedOnType(type) {
        const prioritySelect = document.getElementById('priority');
        if (!prioritySelect) return;

        let priority = 'medium';
        if (type === 'medical' || type === 'accident') {
            priority = 'high';
        } else if (type === 'theft' || type === 'safety') {
            priority = 'high';
        }

        prioritySelect.value = priority;
    }

    // Load emergency contacts
    async function loadEmergencyContacts() {
        try {
            const token = localStorage.getItem('mr-token');
            if (!token) {
                showError('Please log in to view emergency contacts');
                return;
            }

            showLoading();

            const response = await fetch(`${API_BASE_URL}/emergency-contacts`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.status === 'success') {
                emergencyContacts = data.contacts || [];
                displayEmergencyContacts();
            } else {
                throw new Error(data.message || 'Failed to load emergency contacts');
            }
        } catch (error) {
            console.error('Error loading emergency contacts:', error);
            showError('Failed to load emergency contacts. Please try again.');
        }
    }

    // Display emergency contacts
    function displayEmergencyContacts() {
        const listContainer = document.getElementById('emergencyContactsList');
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');

        if (!listContainer) return;

        // Hide loading
        if (loadingState) loadingState.style.display = 'none';

        // Filter contacts
        let filteredContacts = emergencyContacts;
        if (currentFilter !== 'all') {
            filteredContacts = emergencyContacts.filter(contact => contact.status === currentFilter);
        }

        // Show empty state if no contacts
        if (filteredContacts.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            listContainer.innerHTML = '';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        // Render contacts
        listContainer.innerHTML = filteredContacts.map(contact => {
            const createdAt = new Date(contact.createdAt).toLocaleString();
            const statusBadge = getStatusBadge(contact.status);
            const priorityBadge = getPriorityBadge(contact.priority);
            const typeLabel = getEmergencyTypeLabel(contact.emergencyType);

            return `
                <div class="emergency-contact-card" data-id="${contact._id || contact.id}">
                    <div class="card-header-section">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <h5 class="contact-title">
                                    <i class="bi ${getEmergencyTypeIcon(contact.emergencyType)}"></i>
                                    ${typeLabel}
                                </h5>
                                <div class="contact-meta">
                                    <span class="badge ${statusBadge.class}">${statusBadge.text}</span>
                                    <span class="badge ${priorityBadge.class}">${priorityBadge.text}</span>
                                    <span class="text-muted">${createdAt}</span>
                                </div>
                            </div>
                            <button class="btn btn-sm btn-outline-primary" onclick="viewEmergencyDetail('${contact._id || contact.id}')">
                                <i class="bi bi-eye"></i>
                                View Details
                            </button>
                        </div>
                    </div>
                    <div class="card-body-section">
                        <div class="contact-info">
                            <div class="info-item">
                                <i class="bi bi-person"></i>
                                <strong>Contact:</strong> ${contact.contactName}
                            </div>
                            <div class="info-item">
                                <i class="bi bi-telephone"></i>
                                <strong>Phone:</strong> 
                                <a href="tel:${contact.contactPhone}">${contact.contactPhone}</a>
                            </div>
                            ${contact.contactEmail ? `
                                <div class="info-item">
                                    <i class="bi bi-envelope"></i>
                                    <strong>Email:</strong> 
                                    <a href="mailto:${contact.contactEmail}">${contact.contactEmail}</a>
                                </div>
                            ` : ''}
                        </div>
                        <div class="description-preview">
                            <p>${contact.description.substring(0, 150)}${contact.description.length > 150 ? '...' : ''}</p>
                        </div>
                        ${contact.booking ? `
                            <div class="related-booking">
                                <i class="bi bi-calendar-check"></i>
                                <span>Related Booking: ${contact.booking.bookingNumber || 'N/A'}</span>
                            </div>
                        ` : ''}
                        ${contact.response && contact.response.respondedAt ? `
                            <div class="response-info">
                                <i class="bi bi-check-circle text-success"></i>
                                <span>Response: ${new Date(contact.response.respondedAt).toLocaleString()}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Get status badge
    function getStatusBadge(status) {
        const badges = {
            pending: { class: 'bg-warning text-dark', text: 'Pending' },
            contacted: { class: 'bg-info text-white', text: 'Contacted' },
            resolved: { class: 'bg-success text-white', text: 'Resolved' },
            escalated: { class: 'bg-danger text-white', text: 'Escalated' }
        };
        return badges[status] || badges.pending;
    }

    // Get priority badge
    function getPriorityBadge(priority) {
        const badges = {
            low: { class: 'bg-secondary text-white', text: 'Low Priority' },
            medium: { class: 'bg-primary text-white', text: 'Medium Priority' },
            high: { class: 'bg-warning text-dark', text: 'High Priority' },
            critical: { class: 'bg-danger text-white', text: 'Critical' }
        };
        return badges[priority] || badges.medium;
    }

    // Get emergency type label
    function getEmergencyTypeLabel(type) {
        const labels = {
            medical: 'Medical Emergency',
            safety: 'Safety Concern',
            property_damage: 'Property Damage',
            theft: 'Theft',
            accident: 'Accident',
            other: 'Other Emergency'
        };
        return labels[type] || 'Emergency';
    }

    // Get emergency type icon
    function getEmergencyTypeIcon(type) {
        const icons = {
            medical: 'bi-heart-pulse',
            safety: 'bi-shield-exclamation',
            property_damage: 'bi-house-damage',
            theft: 'bi-bag-x',
            accident: 'bi-exclamation-triangle',
            other: 'bi-question-circle'
        };
        return icons[type] || 'bi-exclamation-triangle';
    }

    // Set filter
    function setFilter(filter) {
        currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('[data-filter]').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
            }
        });

        displayEmergencyContacts();
    }

    // Open emergency modal
    function openEmergencyModal() {
        const modal = new bootstrap.Modal(document.getElementById('emergencyModal'));
        const form = document.getElementById('emergencyForm');
        if (form) {
            form.reset();
            // Reset priority to medium
            const prioritySelect = document.getElementById('priority');
            if (prioritySelect) prioritySelect.value = 'medium';
        }
        modal.show();
    }

    // Handle emergency form submission
    async function handleEmergencySubmit(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            // Disable submit button
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Submitting...';

            const token = localStorage.getItem('mr-token');
            if (!token) {
                throw new Error('Please log in to report an emergency');
            }

            const formData = {
                contactName: form.contactName.value.trim(),
                contactPhone: form.contactPhone.value.trim(),
                contactEmail: form.contactEmail.value.trim() || null,
                relationship: form.relationship.value,
                emergencyType: form.emergencyType.value,
                description: form.description.value.trim(),
                bookingId: form.bookingId.value || null,
                priority: form.priority.value,
                location: form.locationAddress.value ? {
                    address: form.locationAddress.value.trim()
                } : null
            };

            // Validation
            if (!formData.contactName || !formData.contactPhone || !formData.emergencyType || !formData.description) {
                throw new Error('Please fill in all required fields');
            }

            if (formData.description.length < 10) {
                throw new Error('Description must be at least 10 characters');
            }

            const response = await fetch(`${API_BASE_URL}/emergency-contacts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('emergencyModal'));
                modal.hide();

                // Show success message
                alert('Emergency contact reported successfully. Our team will contact you shortly.');

                // Reload contacts
                loadEmergencyContacts();
                loadStatistics();
            } else {
                throw new Error(data.message || 'Failed to report emergency');
            }
        } catch (error) {
            console.error('Error submitting emergency:', error);
            alert('Error: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    // View emergency detail
    window.viewEmergencyDetail = async function(contactId) {
        try {
            const token = localStorage.getItem('mr-token');
            if (!token) {
                alert('Please log in to view emergency details');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/emergency-contacts/${contactId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load emergency details');
            }

            const data = await response.json();

            if (data.status === 'success' && data.contact) {
                displayEmergencyDetail(data.contact);
            }
        } catch (error) {
            console.error('Error loading emergency detail:', error);
            alert('Failed to load emergency details');
        }
    };

    // Display emergency detail
    function displayEmergencyDetail(contact) {
        const modal = new bootstrap.Modal(document.getElementById('emergencyDetailModal'));
        const content = document.getElementById('emergencyDetailContent');
        const header = document.getElementById('detailModalHeader');

        if (!content) return;

        const statusBadge = getStatusBadge(contact.status);
        const priorityBadge = getPriorityBadge(contact.priority);
        const typeLabel = getEmergencyTypeLabel(contact.emergencyType);

        // Set header color based on priority
        if (contact.priority === 'critical') {
            header.className = 'modal-header bg-danger text-white';
        } else if (contact.priority === 'high') {
            header.className = 'modal-header bg-warning text-dark';
        } else {
            header.className = 'modal-header';
        }

        content.innerHTML = `
            <div class="emergency-detail">
                <div class="detail-header mb-4">
                    <h4>
                        <i class="bi ${getEmergencyTypeIcon(contact.emergencyType)}"></i>
                        ${typeLabel}
                    </h4>
                    <div class="badges mb-2">
                        <span class="badge ${statusBadge.class} me-2">${statusBadge.text}</span>
                        <span class="badge ${priorityBadge.class}">${priorityBadge.text}</span>
                    </div>
                    <p class="text-muted mb-0">
                        <i class="bi bi-clock"></i>
                        Reported: ${new Date(contact.createdAt).toLocaleString()}
                    </p>
                </div>

                <div class="detail-section mb-4">
                    <h5><i class="bi bi-person"></i> Contact Information</h5>
                    <div class="detail-info">
                        <div class="info-row">
                            <strong>Name:</strong> ${contact.contactName}
                        </div>
                        <div class="info-row">
                            <strong>Phone:</strong> 
                            <a href="tel:${contact.contactPhone}">${contact.contactPhone}</a>
                        </div>
                        ${contact.contactEmail ? `
                            <div class="info-row">
                                <strong>Email:</strong> 
                                <a href="mailto:${contact.contactEmail}">${contact.contactEmail}</a>
                            </div>
                        ` : ''}
                        <div class="info-row">
                            <strong>Relationship:</strong> ${contact.relationship || 'N/A'}
                        </div>
                    </div>
                </div>

                <div class="detail-section mb-4">
                    <h5><i class="bi bi-file-text"></i> Description</h5>
                    <p class="description-text">${contact.description}</p>
                </div>

                ${contact.booking ? `
                    <div class="detail-section mb-4">
                        <h5><i class="bi bi-calendar-check"></i> Related Booking</h5>
                        <div class="detail-info">
                            <div class="info-row">
                                <strong>Booking Number:</strong> ${contact.booking.bookingNumber || 'N/A'}
                            </div>
                            ${contact.booking.checkIn ? `
                                <div class="info-row">
                                    <strong>Check-in:</strong> ${new Date(contact.booking.checkIn).toLocaleDateString()}
                                </div>
                            ` : ''}
                            ${contact.booking.checkOut ? `
                                <div class="info-row">
                                    <strong>Check-out:</strong> ${new Date(contact.booking.checkOut).toLocaleDateString()}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${contact.listing ? `
                    <div class="detail-section mb-4">
                        <h5><i class="bi bi-house"></i> Related Listing</h5>
                        <div class="detail-info">
                            <div class="info-row">
                                <strong>Title:</strong> ${contact.listing.title || 'N/A'}
                            </div>
                            ${contact.listing.location ? `
                                <div class="info-row">
                                    <strong>Location:</strong> ${contact.listing.location.city || ''} ${contact.listing.location.address || ''}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${contact.location && contact.location.address ? `
                    <div class="detail-section mb-4">
                        <h5><i class="bi bi-geo-alt"></i> Emergency Location</h5>
                        <p>${contact.location.address}</p>
                    </div>
                ` : ''}

                ${contact.response && contact.response.respondedAt ? `
                    <div class="detail-section mb-4">
                        <h5><i class="bi bi-check-circle text-success"></i> Response</h5>
                        <div class="detail-info">
                            <div class="info-row">
                                <strong>Responded At:</strong> ${new Date(contact.response.respondedAt).toLocaleString()}
                            </div>
                            ${contact.response.responseNotes ? `
                                <div class="info-row">
                                    <strong>Notes:</strong> ${contact.response.responseNotes}
                                </div>
                            ` : ''}
                            ${contact.response.actionTaken ? `
                                <div class="info-row">
                                    <strong>Action Taken:</strong> ${contact.response.actionTaken}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        modal.show();
    }

    // Load statistics
    async function loadStatistics() {
        try {
            const token = localStorage.getItem('mr-token');
            if (!token) return;

            const response = await fetch(`${API_BASE_URL}/emergency-contacts/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && data.stats) {
                    updateStatistics(data.stats);
                }
            }
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    // Update statistics display
    function updateStatistics(stats) {
        const statTotal = document.getElementById('statTotal');
        const statPending = document.getElementById('statPending');
        const statContacted = document.getElementById('statContacted');
        const statResolved = document.getElementById('statResolved');

        if (statTotal) statTotal.textContent = stats.total || 0;
        if (statPending) statPending.textContent = stats.pending || 0;
        if (statContacted) statContacted.textContent = stats.contacted || 0;
        if (statResolved) statResolved.textContent = stats.resolved || 0;
    }

    // Show loading state
    function showLoading() {
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');
        const listContainer = document.getElementById('emergencyContactsList');

        if (loadingState) loadingState.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
        if (listContainer) listContainer.innerHTML = '';
    }

    // Show error state
    function showError(message) {
        const loadingState = document.getElementById('loadingState');
        const listContainer = document.getElementById('emergencyContactsList');

        if (loadingState) {
            loadingState.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    ${message}
                </div>
            `;
        }
        if (listContainer) listContainer.innerHTML = '';
    }

})();

