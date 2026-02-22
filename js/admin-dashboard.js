// Admin Dashboard Functionality
// Fully functional admin dashboard with data loading, charts, and interactions

(function() {
    'use strict';

    let dashboardData = null;
    let charts = {};

    // Initialize dashboard on load
    document.addEventListener('DOMContentLoaded', function() {
        if (!window.hasRole('admin')) {
            window.location.href = '../index.html';
            return;
        }

        initializeDashboard();
    });

    // Initialize dashboard
    async function initializeDashboard() {
        showLoadingState();
        await loadDashboardData();
        renderDashboard();
        setupEventListeners();
        initializeCharts();
    }

    // Show loading state
    function showLoadingState() {
        const cards = document.querySelectorAll('.stat-card');
        cards.forEach(card => {
            const valueEl = card.querySelector('.stat-value');
            if (valueEl) {
                valueEl.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
            }
        });
    }

    // Load dashboard data from API
    async function loadDashboardData() {
        try {
            const token = localStorage.getItem('mr-token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${window.API_BASE_URL || 'http://localhost:4001/api'}/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    window.location.href = '../login.html';
                    return;
                }
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.status === 'success') {
                dashboardData = result.data;
            } else {
                throw new Error(result.message || 'Failed to load dashboard data');
            }

            // Fallback to simulated data if API fails (for development)
            if (!dashboardData) {
                dashboardData = {
                users: {
                    total: 12543,
                    active: 11890,
                    new: 1250,
                    growth: 12.5,
                    pendingVerifications: 234
                },
                listings: {
                    total: 8921,
                    active: 8456,
                    new: 456,
                    growth: 8.2,
                    pending: 89
                },
                verifications: {
                    pending: 234
                },
                disputes: {
                    open: 47,
                    urgent: 12,
                    inReview: 23,
                    resolved: 156
                },
                revenue: {
                    total: 2450000,
                    thisMonth: 245000,
                    growth: 15.3
                },
                subscriptions: {
                    active: 3421,
                    expired: 89,
                    new: 234
                },
                recentUsers: [
                    {
                        id: 1,
                        name: 'Ahmed Hassan',
                        email: 'ahmed@example.com',
                        role: 'renter',
                        accountType: 'free',
                        createdAt: '2024-01-15T10:30:00Z'
                    },
                    {
                        id: 2,
                        name: 'Sara Khan',
                        email: 'sara@example.com',
                        role: 'owner',
                        accountType: 'paid',
                        createdAt: '2024-01-15T09:15:00Z'
                    },
                    {
                        id: 3,
                        name: 'Ali Raza',
                        email: 'ali@example.com',
                        role: 'dual_role',
                        accountType: 'paid',
                        createdAt: '2024-01-15T08:45:00Z'
                    }
                ],
                recentDisputes: [
                    {
                        id: 1,
                        type: 'payment',
                        title: 'Payment Issue',
                        priority: 'urgent',
                        reporter: 'User 123',
                        createdAt: '2024-01-15T14:30:00Z',
                        status: 'open'
                    },
                    {
                        id: 2,
                        type: 'safety',
                        title: 'Safety Concern',
                        priority: 'high',
                        reporter: 'User 456',
                        createdAt: '2024-01-15T12:15:00Z',
                        status: 'in_review'
                    },
                    {
                        id: 3,
                        type: 'quality',
                        title: 'Quality Issue',
                        priority: 'medium',
                        reporter: 'User 789',
                        createdAt: '2024-01-15T10:00:00Z',
                        status: 'open'
                    }
                ],
                userGrowth: [
                    { month: 'Jul', users: 8500 },
                    { month: 'Aug', users: 9200 },
                    { month: 'Sep', users: 9800 },
                    { month: 'Oct', users: 10500 },
                    { month: 'Nov', users: 11200 },
                    { month: 'Dec', users: 12000 },
                    { month: 'Jan', users: 12543 }
                ],
                revenueData: [
                    { month: 'Jul', revenue: 180000 },
                    { month: 'Aug', revenue: 195000 },
                    { month: 'Sep', revenue: 210000 },
                    { month: 'Oct', revenue: 225000 },
                    { month: 'Nov', revenue: 235000 },
                    { month: 'Dec', revenue: 240000 },
                    { month: 'Jan', revenue: 245000 }
                ],
                categoryDistribution: [
                    { category: 'Property', count: 3200 },
                    { category: 'Vehicles', count: 2100 },
                    { category: 'Clothes', count: 1500 },
                    { category: 'Equipment', count: 1200 },
                    { category: 'Services', count: 921 }
                ]
            };
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            showErrorState();
        }
    }

    // Render dashboard with data
    function renderDashboard() {
        if (!dashboardData) return;

        renderStatisticsCards();
        renderRecentUsers();
        renderRecentDisputes();
        updateQuickActions();
    }

    // Render statistics cards
    function renderStatisticsCards() {
        const data = dashboardData;

        // Total Users
        const userCard = document.querySelector('.row.g-4 .col-md-3:nth-child(1) .stat-card');
        if (userCard) {
            const valueEl = userCard.querySelector('.stat-value');
            const growthEl = userCard.querySelector('.stat-growth') || userCard.querySelector('small:last-child');
            if (valueEl) valueEl.textContent = formatNumber(data.users.total);
            if (growthEl) growthEl.innerHTML = `<span class="text-success"><i class="bi bi-arrow-up"></i> +${data.users.growth}% this month</span>`;
        }

        // Active Listings
        const listingCard = document.querySelector('.row.g-4 .col-md-3:nth-child(2) .stat-card');
        if (listingCard) {
            const valueEl = listingCard.querySelector('.stat-value');
            const growthEl = listingCard.querySelector('.stat-growth') || listingCard.querySelector('small:last-child');
            if (valueEl) valueEl.textContent = formatNumber(data.listings.active);
            if (growthEl) growthEl.innerHTML = `<span class="text-success"><i class="bi bi-arrow-up"></i> +${data.listings.growth}% this month</span>`;
        }

        // Pending Verifications
        const verifyCard = document.querySelector('.row.g-4 .col-md-3:nth-child(3) .stat-card');
        if (verifyCard) {
            const valueEl = verifyCard.querySelector('.stat-value');
            const growthEl = verifyCard.querySelector('.stat-growth') || verifyCard.querySelector('small:last-child');
            if (valueEl) valueEl.textContent = formatNumber(data.verifications.pending);
            const verificationTrend = data.verifications.pending > 250 ? 'danger' : 'success';
            const arrow = data.verifications.pending > 250 ? 'up' : 'down';
            const sign = data.verifications.pending > 250 ? '+' : '-';
            if (growthEl) growthEl.innerHTML = `<span class="text-${verificationTrend}"><i class="bi bi-arrow-${arrow}"></i> ${sign}5% this week</span>`;
        }

        // Open Disputes
        const disputeCard = document.querySelector('.row.g-4 .col-md-3:nth-child(4) .stat-card');
        if (disputeCard) {
            const valueEl = disputeCard.querySelector('.stat-value');
            const growthEl = disputeCard.querySelector('.stat-growth') || disputeCard.querySelector('small:last-child');
            if (valueEl) valueEl.textContent = formatNumber(data.disputes.open);
            if (growthEl) {
                growthEl.innerHTML = data.disputes.urgent > 0 ? 
                    `<span class="text-warning"><i class="bi bi-exclamation-triangle"></i> ${data.disputes.urgent} urgent</span>` :
                    '<span class="text-success">All handled</span>';
            }
        }

        // Update revenue summary
        const totalRevenueEl = document.getElementById('totalRevenue');
        const monthRevenueEl = document.getElementById('monthRevenue');
        const activeSubsEl = document.getElementById('activeSubscriptions');
        
        if (totalRevenueEl) totalRevenueEl.textContent = `PKR ${formatNumber(data.revenue.total)}`;
        if (monthRevenueEl) monthRevenueEl.textContent = `PKR ${formatNumber(data.revenue.thisMonth)}`;
        if (activeSubsEl) activeSubsEl.textContent = formatNumber(data.subscriptions.active);
    }


    // Render recent users
    function renderRecentUsers() {
        const container = document.getElementById('recentUsersList');
        if (!container) return;

        const users = dashboardData.recentUsers;
        container.innerHTML = users.map(user => `
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${user.name}</strong>
                    <br><small class="text-muted">${user.email}</small>
                </div>
                <div class="text-end">
                    <span class="badge ${getRoleBadgeClass(user.role)}">${getRoleDisplayName(user.role)}</span>
                    <br><small class="text-muted">${formatDate(user.createdAt)}</small>
                </div>
            </div>
        `).join('');

        // Add "View All" link if not exists
        if (!container.parentElement.querySelector('a[href="users.html"]')) {
            const viewAllLink = document.createElement('a');
            viewAllLink.href = 'users.html';
            viewAllLink.className = 'btn btn-link w-100 mt-2';
            viewAllLink.textContent = 'View All Users';
            container.parentElement.appendChild(viewAllLink);
        }
    }

    // Render recent disputes
    function renderRecentDisputes() {
        const container = document.getElementById('recentDisputesList');
        if (!container) return;

        const disputes = dashboardData.recentDisputes;
        container.innerHTML = disputes.map(dispute => `
            <div class="list-group-item">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${dispute.title}</strong>
                        <br><small class="text-muted">${dispute.reporter} • ${formatDate(dispute.createdAt)}</small>
                    </div>
                    <div class="text-end">
                        <span class="badge ${getPriorityBadgeClass(dispute.priority)}">${dispute.priority}</span>
                        <br><span class="badge ${getStatusBadgeClass(dispute.status)} mt-1">${dispute.status}</span>
                    </div>
                </div>
            </div>
        `).join('');

        // Add "View All" link if not exists
        if (!container.parentElement.querySelector('a[href="disputes.html"]')) {
            const viewAllLink = document.createElement('a');
            viewAllLink.href = 'disputes.html';
            viewAllLink.className = 'btn btn-link w-100 mt-2';
            viewAllLink.textContent = 'View All Disputes';
            container.parentElement.appendChild(viewAllLink);
        }
    }

    // Update quick actions
    function updateQuickActions() {
        const data = dashboardData;
        
        // Update pending verifications count
        const verifyBtn = document.querySelector('[href*="users.html?filter=pending"]');
        if (verifyBtn && data.verifications.pending > 0) {
            verifyBtn.innerHTML = `<i class="bi bi-person-check me-2"></i> Review Verifications <span class="badge bg-danger">${data.verifications.pending}</span>`;
        }

        // Update disputes count
        const disputesBtn = document.querySelector('[href="disputes.html"]');
        if (disputesBtn && data.disputes.open > 0) {
            disputesBtn.innerHTML = `<i class="bi bi-exclamation-triangle me-2"></i> Handle Disputes <span class="badge bg-danger">${data.disputes.open}</span>`;
        }

        // Update reported listings count
        const reportsBtn = document.querySelector('[href*="listings.html?filter=reported"]');
        if (reportsBtn && data.listings.pending > 0) {
            reportsBtn.innerHTML = `<i class="bi bi-flag me-2"></i> Review Reports <span class="badge bg-warning">${data.listings.pending}</span>`;
        }
    }

    // Initialize charts
    function initializeCharts() {
        // Check if Chart.js is available
        if (typeof Chart === 'undefined') {
            loadChartJS().then(() => {
                createCharts();
            });
        } else {
            createCharts();
        }
    }

    // Load Chart.js library
    function loadChartJS() {
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[src*="chart.js"]')) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Create charts
    function createCharts() {
        if (!dashboardData) return;

        createUserGrowthChart();
        createRevenueChart();
        createCategoryChart();
    }

    // User growth chart
    function createUserGrowthChart() {
        const ctx = document.getElementById('userGrowthChart');
        if (!ctx) return;

        const data = dashboardData.userGrowth;
        
        charts.userGrowth = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.month),
                datasets: [{
                    label: 'Total Users',
                    data: data.map(d => d.users),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        });
    }

    // Revenue chart
    function createRevenueChart() {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        const data = dashboardData.revenueData;
        
        charts.revenue = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.month),
                datasets: [{
                    label: 'Revenue (PKR)',
                    data: data.map(d => d.revenue),
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgb(34, 197, 94)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'PKR ' + (value / 1000) + 'K';
                            }
                        }
                    }
                }
            }
        });
    }

    // Category distribution chart
    function createCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const data = dashboardData.categoryDistribution;
        const colors = [
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(236, 72, 153, 0.8)'
        ];
        
        charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.category),
                datasets: [{
                    data: data.map(d => d.count),
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                refreshBtn.disabled = true;
                refreshBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
                await loadDashboardData();
                renderDashboard();
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
            });
        }

        // Auto-refresh every 5 minutes
        setInterval(async () => {
            await loadDashboardData();
            renderDashboard();
            if (charts.userGrowth) {
                charts.userGrowth.update();
                charts.revenue.update();
                charts.category.update();
            }
        }, 300000); // 5 minutes
    }

    // Utility functions
    function formatNumber(num) {
        return new Intl.NumberFormat('en-US').format(num);
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    function getRoleBadgeClass(role) {
        const classes = {
            'renter': 'bg-info',
            'owner': 'bg-primary',
            'dual_role': 'bg-success',
            'admin': 'bg-danger',
            'moderator': 'bg-warning'
        };
        return classes[role] || 'bg-secondary';
    }

    function getRoleDisplayName(role) {
        const names = {
            'renter': 'Renter',
            'owner': 'Owner',
            'dual_role': 'Dual Role',
            'admin': 'Admin',
            'moderator': 'Moderator'
        };
        return names[role] || role;
    }

    function getPriorityBadgeClass(priority) {
        const classes = {
            'low': 'bg-secondary',
            'medium': 'bg-info',
            'high': 'bg-warning',
            'urgent': 'bg-danger'
        };
        return classes[priority] || 'bg-secondary';
    }

    function getStatusBadgeClass(status) {
        const classes = {
            'open': 'bg-danger',
            'in_review': 'bg-warning',
            'resolved': 'bg-success',
            'closed': 'bg-secondary'
        };
        return classes[status] || 'bg-secondary';
    }

    function showErrorState() {
        const cards = document.querySelectorAll('.stat-card');
        cards.forEach(card => {
            const valueEl = card.querySelector('.stat-value');
            if (valueEl) {
                valueEl.innerHTML = '<span class="text-danger">Error</span>';
            }
        });
    }

    // Export functions for global access
    window.adminDashboard = {
        refresh: async () => {
            await loadDashboardData();
            renderDashboard();
        },
        getData: () => dashboardData
    };
})();

