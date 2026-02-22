// Dispute Resolution Management
(function() {
    'use strict';

    const API_BASE_URL = window.API_BASE_URL || 'http://localhost:4001/api';
    let disputes = [];
    let currentFilters = {
        status: '',
        type: '',
        priority: ''
    };

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        console.log('⚖️ Disputes page initialized');
        
        // Check authentication
        if (!window.isLoggedIn || !window.isLoggedIn()) {
            window.location.href = 'login.html';
            return;
        }

        initDisputes();
    });

    // Initialize disputes page
    function initDisputes() {
        // Load disputes
        loadDisputes();

        // Setup event listeners
        setupEventListeners();
    }

    // Setup event listeners
    function setupEventListeners() {
        // New dispute button
        const newDisputeBtn = document.getElementById('newDisputeBtn');
        if (newDisputeBtn) {
            newDisputeBtn.addEventListener('click', function() {
                openNewDisputeModal();
            });
        }

        // Dispute form submission
        const newDisputeForm = document.getElementById('newDisputeForm');
        if (newDisputeForm) {
            newDisputeForm.addEventListener('submit', handleDisputeSubmit);
        }

        // Character count for description
        const descriptionTextarea = document.getElementById('disputeDescription');
        if (descriptionTextarea) {
            descriptionTextarea.addEventListener('input', function() {
                const charCount = this.value.length;
                const charCountEl = document.getElementById('charCount');
                if (charCountEl) {
                    charCountEl.textContent = charCount;
                    if (charCount > 2000) {
                        charCountEl.classList.add('text-danger');
                    } else {
                        charCountEl.classList.remove('text-danger');
                    }
                }
            });
        }

        // Filter inputs
        const filterStatus = document.getElementById('filterStatus');
        const filterType = document.getElementById('filterType');
        const filterPriority = document.getElementById('filterPriority');
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');

        if (filterStatus) {
            filterStatus.addEventListener('change', function() {
                currentFilters.status = this.value;
                loadDisputes();
            });
        }

        if (filterType) {
            filterType.addEventListener('change', function() {
                currentFilters.type = this.value;
                loadDisputes();
            });
        }

        if (filterPriority) {
            filterPriority.addEventListener('change', function() {
                currentFilters.priority = this.value;
                loadDisputes();
            });
        }

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', function() {
                currentFilters = { status: '', type: '', priority: '' };
                if (filterStatus) filterStatus.value = '';
                if (filterType) filterType.value = '';
                if (filterPriority) filterPriority.value = '';
                loadDisputes();
            });
        }
    }

    // Load disputes
    async function loadDisputes() {
        try {
            showLoading(true);
            
            const token = localStorage.getItem('mr-token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            // Build query string
            const queryParams = new URLSearchParams();
            if (currentFilters.status) queryParams.append('status', currentFilters.status);
            if (currentFilters.type) queryParams.append('type', currentFilters.type);
            if (currentFilters.priority) queryParams.append('priority', currentFilters.priority);

            const url = `${API_BASE_URL}/disputes${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && Array.isArray(data.data)) {
                    disputes = data.data;
                    displayDisputes();
                    updateStatistics();
                } else {
                    showError('Failed to load disputes');
                }
            } else {
                const error = await response.json();
                showError(error.message || 'Failed to load disputes');
            }
        } catch (error) {
            console.error('Error loading disputes:', error);
            showError('Network error. Please try again.');
        } finally {
            showLoading(false);
        }
    }

    // Display disputes
    function displayDisputes() {
        const disputesList = document.getElementById('disputesList');
        const emptyState = document.getElementById('emptyState');

        if (!disputesList) return;

        if (disputes.length === 0) {
            disputesList.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        disputesList.innerHTML = disputes.map(dispute => createDisputeCard(dispute)).join('');
        
        // Add click listeners to view buttons
        disputes.forEach(dispute => {
            const viewBtn = document.getElementById(`viewDispute-${dispute.id}`);
            if (viewBtn) {
                viewBtn.addEventListener('click', () => viewDisputeDetails(dispute.id));
            }
        });
    }

    // Create dispute card HTML
    function createDisputeCard(dispute) {
        const statusBadge = getStatusBadge(dispute.status);
        const typeBadge = getTypeBadge(dispute.type);
        const priorityBadge = getPriorityBadge(dispute.priority);
        const date = new Date(dispute.createdAt).toLocaleDateString();

        return `
            <div class="dispute-card">
                <div class="dispute-card-header">
                    <div class="dispute-title-section">
                        <h5 class="dispute-title">${escapeHtml(dispute.title)}</h5>
                        <div class="dispute-badges">
                            ${statusBadge}
                            ${typeBadge}
                            ${priorityBadge}
                        </div>
                    </div>
                    <div class="dispute-actions">
                        <button class="btn btn-sm btn-outline-primary" id="viewDispute-${dispute.id}">
                            <i class="bi bi-eye"></i> View Details
                        </button>
                    </div>
                </div>
                <div class="dispute-card-body">
                    <p class="dispute-description">${escapeHtml(dispute.description.substring(0, 150))}${dispute.description.length > 150 ? '...' : ''}</p>
                    <div class="dispute-meta">
                        <span class="meta-item">
                            <i class="bi bi-calendar"></i>
                            Filed: ${date}
                        </span>
                        ${dispute.booking ? `
                            <span class="meta-item">
                                <i class="bi bi-calendar-check"></i>
                                Booking: ${dispute.booking.bookingNumber || 'N/A'}
                            </span>
                        ` : ''}
                        ${dispute.reportedUser ? `
                            <span class="meta-item">
                                <i class="bi bi-person"></i>
                                Reported: ${escapeHtml(dispute.reportedUser.name || 'Unknown')}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    // Get status badge HTML
    function getStatusBadge(status) {
        const badges = {
            open: '<span class="badge bg-warning">Open</span>',
            in_review: '<span class="badge bg-info">In Review</span>',
            resolved: '<span class="badge bg-success">Resolved</span>',
            closed: '<span class="badge bg-secondary">Closed</span>',
            rejected: '<span class="badge bg-danger">Rejected</span>'
        };
        return badges[status] || '<span class="badge bg-secondary">Unknown</span>';
    }

    // Get type badge HTML
    function getTypeBadge(type) {
        const badges = {
            payment: '<span class="badge bg-primary">Payment</span>',
            safety: '<span class="badge bg-danger">Safety</span>',
            quality: '<span class="badge bg-warning">Quality</span>',
            behavior: '<span class="badge bg-info">Behavior</span>',
            fraud: '<span class="badge bg-dark">Fraud</span>',
            other: '<span class="badge bg-secondary">Other</span>'
        };
        return badges[type] || '<span class="badge bg-secondary">Unknown</span>';
    }

    // Get priority badge HTML
    function getPriorityBadge(priority) {
        const badges = {
            low: '<span class="badge bg-light text-dark">Low</span>',
            medium: '<span class="badge bg-warning">Medium</span>',
            high: '<span class="badge bg-danger">High</span>',
            urgent: '<span class="badge bg-dark">Urgent</span>'
        };
        return badges[priority] || '<span class="badge bg-secondary">Unknown</span>';
    }

    // Update statistics
    function updateStatistics() {
        const total = disputes.length;
        const open = disputes.filter(d => d.status === 'open').length;
        const inReview = disputes.filter(d => d.status === 'in_review').length;
        const resolved = disputes.filter(d => d.status === 'resolved').length;

        const statTotal = document.getElementById('statTotal');
        const statOpen = document.getElementById('statOpen');
        const statInReview = document.getElementById('statInReview');
        const statResolved = document.getElementById('statResolved');

        if (statTotal) statTotal.textContent = total;
        if (statOpen) statOpen.textContent = open;
        if (statInReview) statInReview.textContent = inReview;
        if (statResolved) statResolved.textContent = resolved;
    }

    // Open new dispute modal
    function openNewDisputeModal() {
        const modal = new bootstrap.Modal(document.getElementById('newDisputeModal'));
        const form = document.getElementById('newDisputeForm');
        if (form) {
            form.reset();
            const charCountEl = document.getElementById('charCount');
            if (charCountEl) charCountEl.textContent = '0';
        }
        modal.show();
    }

    // Handle dispute form submission
    async function handleDisputeSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';

            const token = localStorage.getItem('mr-token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            // Get form values
            const bookingIdValue = form.bookingId.value.trim();
            const listingIdValue = form.listingId.value.trim();

            const formData = {
                type: form.disputeType.value,
                title: form.disputeTitle.value.trim(),
                description: form.disputeDescription.value.trim(),
                priority: form.disputePriority.value || 'medium'
            };

            // Only include bookingId and listingId if they have values
            if (bookingIdValue) {
                formData.bookingId = bookingIdValue;
            }
            if (listingIdValue) {
                formData.listingId = listingIdValue;
            }

            const response = await fetch(`${API_BASE_URL}/disputes`, {
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
                const modal = bootstrap.Modal.getInstance(document.getElementById('newDisputeModal'));
                if (modal) modal.hide();

                // Reset form
                form.reset();
                const charCountEl = document.getElementById('charCount');
                if (charCountEl) charCountEl.textContent = '0';

                // Show success message
                showSuccess('Dispute filed successfully!');

                // Reload disputes
                loadDisputes();
            } else {
                // Show detailed error message
                const errorMessage = data.message || 'Failed to file dispute';
                const errorDetails = data.errors ? data.errors.join(', ') : '';
                showError(errorMessage + (errorDetails ? ': ' + errorDetails : ''));
            }
        } catch (error) {
            console.error('Error submitting dispute:', error);
            showError('Network error. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    // View dispute details
    async function viewDisputeDetails(disputeId) {
        try {
            const token = localStorage.getItem('mr-token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            const response = await fetch(`${API_BASE_URL}/disputes/${disputeId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && data.data) {
                    displayDisputeDetails(data.data);
                    const modal = new bootstrap.Modal(document.getElementById('disputeDetailModal'));
                    modal.show();
                } else {
                    showError('Failed to load dispute details');
                }
            } else {
                const error = await response.json();
                showError(error.message || 'Failed to load dispute details');
            }
        } catch (error) {
            console.error('Error loading dispute details:', error);
            showError('Network error. Please try again.');
        }
    }

    // Display dispute details
    function displayDisputeDetails(dispute) {
        const content = document.getElementById('disputeDetailContent');
        if (!content) return;

        const statusBadge = getStatusBadge(dispute.status);
        const typeBadge = getTypeBadge(dispute.type);
        const priorityBadge = getPriorityBadge(dispute.priority);
        const createdAt = new Date(dispute.createdAt).toLocaleString();
        const updatedAt = new Date(dispute.updatedAt).toLocaleString();

        let resolutionHtml = '';
        if (dispute.resolution) {
            const resolvedAt = new Date(dispute.resolution.resolvedAt).toLocaleString();
            resolutionHtml = `
                <div class="card mb-3">
                    <div class="card-header bg-success text-white">
                        <h6 class="mb-0"><i class="bi bi-check-circle"></i> Resolution</h6>
                    </div>
                    <div class="card-body">
                        <p><strong>Action:</strong> ${dispute.resolution.action || 'N/A'}</p>
                        <p><strong>Resolved At:</strong> ${resolvedAt}</p>
                        ${dispute.resolution.resolutionNotes ? `
                            <p><strong>Notes:</strong> ${escapeHtml(dispute.resolution.resolutionNotes)}</p>
                        ` : ''}
                        ${dispute.resolution.refundAmount ? `
                            <p><strong>Refund Amount:</strong> ${dispute.resolution.refundAmount}</p>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        let updatesHtml = '';
        if (dispute.updates && dispute.updates.length > 0) {
            updatesHtml = `
                <div class="card mb-3">
                    <div class="card-header">
                        <h6 class="mb-0"><i class="bi bi-clock-history"></i> Updates & Notes</h6>
                    </div>
                    <div class="card-body">
                        ${dispute.updates.map(update => `
                            <div class="update-item mb-3 pb-3 border-bottom">
                                <p class="mb-1">${escapeHtml(update.note)}</p>
                                <small class="text-muted">
                                    <i class="bi bi-person"></i> ${update.addedBy?.name || 'System'} 
                                    <i class="bi bi-clock ms-2"></i> ${new Date(update.addedAt).toLocaleString()}
                                </small>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        content.innerHTML = `
            <div class="dispute-detail">
                <div class="card mb-3">
                    <div class="card-header">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">${escapeHtml(dispute.title)}</h5>
                            <div>
                                ${statusBadge}
                                ${typeBadge}
                                ${priorityBadge}
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <p><strong>Description:</strong></p>
                        <p>${escapeHtml(dispute.description)}</p>
                        
                        <div class="row mt-3">
                            <div class="col-md-6">
                                <p><strong><i class="bi bi-calendar"></i> Created:</strong> ${createdAt}</p>
                                <p><strong><i class="bi bi-arrow-clockwise"></i> Updated:</strong> ${updatedAt}</p>
                            </div>
                            <div class="col-md-6">
                                ${dispute.booking ? `
                                    <p><strong><i class="bi bi-calendar-check"></i> Booking:</strong> ${dispute.booking.bookingNumber || 'N/A'}</p>
                                ` : ''}
                                ${dispute.reportedUser ? `
                                    <p><strong><i class="bi bi-person"></i> Reported User:</strong> ${escapeHtml(dispute.reportedUser.name || 'Unknown')}</p>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>

                ${resolutionHtml}
                ${updatesHtml}
            </div>
        `;
    }

    // Show loading state
    function showLoading(show) {
        const loadingState = document.getElementById('loadingState');
        const disputesList = document.getElementById('disputesList');
        
        if (loadingState) loadingState.style.display = show ? 'block' : 'none';
        if (disputesList && show) disputesList.innerHTML = '';
    }

    // Show error message
    function showError(message) {
        // Create or update error alert
        let errorAlert = document.getElementById('disputeErrorAlert');
        if (!errorAlert) {
            errorAlert = document.createElement('div');
            errorAlert.id = 'disputeErrorAlert';
            errorAlert.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
            errorAlert.style.zIndex = '9999';
            errorAlert.style.minWidth = '400px';
            errorAlert.innerHTML = `
                <strong>Error!</strong> <span id="disputeErrorText"></span>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            document.body.appendChild(errorAlert);
        }
        document.getElementById('disputeErrorText').textContent = message;
        errorAlert.classList.add('show');
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorAlert) {
                errorAlert.classList.remove('show');
                setTimeout(() => errorAlert.remove(), 300);
            }
        }, 5000);
    }

    // Show success message
    function showSuccess(message) {
        // Create or update success alert
        let successAlert = document.getElementById('disputeSuccessAlert');
        if (!successAlert) {
            successAlert = document.createElement('div');
            successAlert.id = 'disputeSuccessAlert';
            successAlert.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
            successAlert.style.zIndex = '9999';
            successAlert.style.minWidth = '400px';
            successAlert.innerHTML = `
                <strong>Success!</strong> <span id="disputeSuccessText"></span>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            document.body.appendChild(successAlert);
        }
        document.getElementById('disputeSuccessText').textContent = message;
        successAlert.classList.add('show');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            if (successAlert) {
                successAlert.classList.remove('show');
                setTimeout(() => successAlert.remove(), 300);
            }
        }, 3000);
    }

    // Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
})();

