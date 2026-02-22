// My Listings Page - Owner Listing Management
(function() {
    'use strict';

    const API_BASE = window.API_BASE || 'http://localhost:4001/api';

    let allListings = [];
    let currentFilter = 'all';

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        initMyListingsPage();
    });

    async function initMyListingsPage() {
        console.log('📋 Initializing My Listings page...');
        
        // Check authentication
        const token = localStorage.getItem('mr-token');
        if (!token) {
            console.log('❌ No token found, redirecting to login');
            window.location.href = 'login.html?redirect=my-listings.html';
            return;
        }

        // Load owner stats and listings
        await Promise.all([
            loadOwnerStats(),
            loadOwnerListings(),
        ]);
    }

    // Load owner statistics
    async function loadOwnerStats() {
        try {
            const token = localStorage.getItem('mr-token');
            const res = await fetch(`${API_BASE}/owner/stats`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!res.ok) {
                console.warn('Failed to load owner stats');
                return;
            }

            const data = await res.json();
            if (data.status === 'success' && data.stats) {
                const stats = data.stats;
                
                // Update stat cards
                document.getElementById('stat-active').textContent = stats.activeListings || 0;
                document.getElementById('stat-draft').textContent = stats.draftListings || 0;
                document.getElementById('stat-paused').textContent = stats.pausedListings || 0;
                document.getElementById('stat-bookings').textContent = stats.totalBookings || 0;
            }
        } catch (err) {
            console.error('Error loading owner stats:', err);
        }
    }

    // Load owner listings
    async function loadOwnerListings() {
        const loadingState = document.getElementById('loadingState');
        const listingsGrid = document.getElementById('listingsGrid');
        const emptyState = document.getElementById('emptyState');

        loadingState.style.display = 'flex';
        listingsGrid.style.display = 'none';
        emptyState.style.display = 'none';

        try {
            const token = localStorage.getItem('mr-token');
            const res = await fetch(`${API_BASE}/listings/owner/me`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!res.ok) {
                throw new Error('Failed to load listings');
            }

            const data = await res.json();
            allListings = data.listings || [];

            // Update filter counts
            updateFilterCounts();

            loadingState.style.display = 'none';

            if (allListings.length === 0) {
                emptyState.style.display = 'block';
            } else {
                listingsGrid.style.display = 'grid';
                renderListings(getFilteredListings());
            }

        } catch (err) {
            console.error('Error loading listings:', err);
            loadingState.innerHTML = `
                <div class="text-danger">
                    <i class="bi bi-exclamation-circle" style="font-size: 2rem;"></i>
                    <p>Failed to load listings. Please try again.</p>
                    <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    }

    // Update filter tab counts
    function updateFilterCounts() {
        const counts = {
            all: allListings.length,
            active: allListings.filter(l => l.status === 'active').length,
            draft: allListings.filter(l => l.status === 'draft').length,
            inactive: allListings.filter(l => l.status === 'inactive').length,
        };

        document.getElementById('count-all').textContent = counts.all;
        document.getElementById('count-active').textContent = counts.active;
        document.getElementById('count-draft').textContent = counts.draft;
        document.getElementById('count-inactive').textContent = counts.inactive;
    }

    // Get filtered listings based on current filter
    function getFilteredListings() {
        if (currentFilter === 'all') {
            return allListings;
        }
        return allListings.filter(l => l.status === currentFilter);
    }

    // Filter listings
    window.filterListings = function(filter) {
        currentFilter = filter;

        // Update active tab
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });

        const filtered = getFilteredListings();
        const listingsGrid = document.getElementById('listingsGrid');
        const emptyState = document.getElementById('emptyState');

        if (filtered.length === 0) {
            listingsGrid.style.display = 'none';
            emptyState.style.display = 'block';
            emptyState.querySelector('.empty-title').textContent = `No ${filter === 'all' ? '' : filter} listings`;
            emptyState.querySelector('.empty-description').textContent = 
                filter === 'all' 
                    ? 'Start earning by creating your first listing!'
                    : `You don't have any ${filter} listings yet.`;
        } else {
            emptyState.style.display = 'none';
            listingsGrid.style.display = 'grid';
            renderListings(filtered);
        }
    };

    // Render listings to the grid
    function renderListings(listings) {
        const grid = document.getElementById('listingsGrid');
        
        grid.innerHTML = listings.map(listing => {
            const imageUrl = listing.images?.[0]?.url || '';
            const hasImage = !!imageUrl;
            const city = listing.location?.city || 'Unknown';
            const price = listing.pricing?.amount || 0;
            const pricingModel = listing.pricing?.model || 'daily';
            const status = listing.status || 'draft';
            const category = formatCategory(listing.category);
            const bookingStats = listing.bookingStats || { total: 0, pending: 0 };
            const stats = listing.stats || { views: 0, reviews: 0, averageRating: 0 };

            return `
                <div class="listing-card" data-listing-id="${listing.id}">
                    <div class="listing-card-image">
                        ${hasImage 
                            ? `<img src="${imageUrl}" alt="${escapeHtml(listing.title)}" loading="lazy">`
                            : `<div class="placeholder-image"><i class="bi bi-image"></i></div>`
                        }
                        <span class="listing-status-badge ${status}">${formatStatus(status)}</span>
                        ${bookingStats.pending > 0 ? `
                            <div class="listing-booking-stats">
                                <span class="booking-stat-badge pending">
                                    <i class="bi bi-clock"></i>
                                    ${bookingStats.pending} pending
                                </span>
                            </div>
                        ` : ''}
                    </div>
                    <div class="listing-card-content">
                        <div class="listing-card-category">${category}</div>
                        <h3 class="listing-card-title">${escapeHtml(listing.title)}</h3>
                        <div class="listing-card-location">
                            <i class="bi bi-geo-alt-fill"></i>
                            <span>${escapeHtml(city)}</span>
                        </div>
                        <div class="listing-card-price">
                            <span class="price-amount">Rs ${formatPrice(price)}</span>
                            <span class="price-period">/ ${pricingModel}</span>
                        </div>
                        <div class="listing-card-stats">
                            <div class="card-stat">
                                <i class="bi bi-eye"></i>
                                <span>${stats.views || 0} views</span>
                            </div>
                            <div class="card-stat">
                                <i class="bi bi-calendar-check"></i>
                                <span>${bookingStats.total || 0} bookings</span>
                            </div>
                            ${stats.averageRating > 0 ? `
                                <div class="card-stat">
                                    <i class="bi bi-star-fill" style="color: #ffc107;"></i>
                                    <span>${stats.averageRating.toFixed(1)}</span>
                                </div>
                            ` : ''}
                        </div>
                        <div class="listing-card-actions">
                            <a href="listing-detail.html?id=${listing.id}" class="listing-action-btn view">
                                <i class="bi bi-eye"></i>
                                View
                            </a>
                            <button class="listing-action-btn edit" onclick="openEditModal('${listing.id}')">
                                <i class="bi bi-pencil"></i>
                                Edit
                            </button>
                            <button class="listing-action-btn status" onclick="toggleListingStatus('${listing.id}', '${status}')">
                                <i class="bi bi-${status === 'active' ? 'pause' : 'play'}-fill"></i>
                                ${status === 'active' ? 'Pause' : 'Publish'}
                            </button>
                            <button class="listing-action-btn delete" onclick="openDeleteModal('${listing.id}', '${escapeHtml(listing.title)}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Open edit modal
    window.openEditModal = function(listingId) {
        const listing = allListings.find(l => l.id === listingId);
        if (!listing) return;

        document.getElementById('edit-listing-id').value = listingId;
        document.getElementById('edit-title').value = listing.title || '';
        document.getElementById('edit-description').value = listing.description || '';
        document.getElementById('edit-price').value = listing.pricing?.amount || 0;
        document.getElementById('edit-pricing-model').value = listing.pricing?.model || 'daily';
        document.getElementById('edit-instant-booking').checked = listing.availability?.instantBooking || false;
        document.getElementById('edit-address').value = listing.location?.address || '';
        document.getElementById('edit-city').value = listing.location?.city || '';

        const modal = new bootstrap.Modal(document.getElementById('editListingModal'));
        modal.show();
    };

    // Save listing edit
    window.saveListingEdit = async function() {
        const listingId = document.getElementById('edit-listing-id').value;
        const title = document.getElementById('edit-title').value.trim();
        const description = document.getElementById('edit-description').value.trim();
        const pricingAmount = parseFloat(document.getElementById('edit-price').value) || 0;
        const pricingModel = document.getElementById('edit-pricing-model').value;
        const instantBooking = document.getElementById('edit-instant-booking').checked;
        const address = document.getElementById('edit-address').value.trim();
        const city = document.getElementById('edit-city').value;

        if (!title || !description) {
            alert('Please fill in all required fields.');
            return;
        }

        // Optional: basic validation for address and city (do not hard block if empty to keep quick-edit flexible)

        try {
            const token = localStorage.getItem('mr-token');
            const res = await fetch(`${API_BASE}/listings/${listingId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    description,
                    pricingAmount,
                    pricingModel,
                    instantBooking,
                    // Location quick updates
                    address: address || undefined,
                    city: city || undefined,
                }),
            });

            const data = await res.json();

            if (res.ok && data.status === 'success') {
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('editListingModal')).hide();
                
                // Reload listings
                await loadOwnerListings();
                
                // Show success message
                showToast('Listing updated successfully!', 'success');
            } else {
                throw new Error(data.message || 'Failed to update listing');
            }
        } catch (err) {
            console.error('Error updating listing:', err);
            showToast(err.message || 'Failed to update listing', 'error');
        }
    };

    // Toggle listing status (publish/pause)
    window.toggleListingStatus = async function(listingId, currentStatus) {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'publish' : 'pause';

        if (!confirm(`Are you sure you want to ${action} this listing?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('mr-token');
            const res = await fetch(`${API_BASE}/listings/${listingId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await res.json();

            if (res.ok && data.status === 'success') {
                await loadOwnerListings();
                await loadOwnerStats();
                showToast(`Listing ${action}ed successfully!`, 'success');
            } else {
                throw new Error(data.message || `Failed to ${action} listing`);
            }
        } catch (err) {
            console.error('Error toggling listing status:', err);
            showToast(err.message || 'Failed to update listing status', 'error');
        }
    };

    // Open delete confirmation modal
    window.openDeleteModal = function(listingId, title) {
        document.getElementById('delete-listing-id').value = listingId;
        document.getElementById('delete-listing-title').textContent = title;

        const modal = new bootstrap.Modal(document.getElementById('deleteListingModal'));
        modal.show();
    };

    // Confirm delete listing
    window.confirmDeleteListing = async function() {
        const listingId = document.getElementById('delete-listing-id').value;

        try {
            const token = localStorage.getItem('mr-token');
            const res = await fetch(`${API_BASE}/listings/${listingId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const data = await res.json();

            if (res.ok && data.status === 'success') {
                // Close modal
                bootstrap.Modal.getInstance(document.getElementById('deleteListingModal')).hide();
                
                // Reload listings
                await loadOwnerListings();
                await loadOwnerStats();
                
                showToast('Listing deleted successfully!', 'success');
            } else {
                throw new Error(data.message || 'Failed to delete listing');
            }
        } catch (err) {
            console.error('Error deleting listing:', err);
            showToast(err.message || 'Failed to delete listing', 'error');
        }
    };

    // Helper functions
    function formatCategory(category) {
        if (!category) return 'Other';
        return category.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    function formatStatus(status) {
        const statusMap = {
            'active': 'Active',
            'draft': 'Draft',
            'inactive': 'Paused',
            'pending': 'Pending',
            'suspended': 'Suspended',
        };
        return statusMap[status] || status;
    }

    function formatPrice(price) {
        return price.toLocaleString('en-PK');
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function showToast(message, type = 'info') {
        // Create toast container if it doesn't exist
        let toastContainer = document.querySelector('.toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '1100';
            document.body.appendChild(toastContainer);
        }

        const toastId = 'toast-' + Date.now();
        const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-primary';

        const toastHtml = `
            <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHtml);

        const toastEl = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastEl, { autohide: true, delay: 3000 });
        toast.show();

        // Remove toast element after it's hidden
        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }

})();

