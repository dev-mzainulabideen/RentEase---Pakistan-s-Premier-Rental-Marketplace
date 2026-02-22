import React, { useState, useEffect } from 'react';
import './App.css';
import DashboardWidget from './components/DashboardWidget';
import StatsCard from './components/StatsCard';
import ActivityFeed from './components/ActivityFeed';

function App() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeListings: 0,
    totalBookings: 0,
    revenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch stats from backend API
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('mr-token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch('http://localhost:4001/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'success') {
            setStats({
              totalUsers: data.data.totalUsers || 0,
              activeListings: data.data.activeListings || 0,
              totalBookings: data.data.totalBookings || 0,
              revenue: data.data.revenue || 0
            });
          }
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>My Rental Marketplace</h1>
        <p>React Components (MERN Stack Demo)</p>
      </header>
      
      <main className="App-main">
        <div className="container-fluid py-4">
          <div className="row mb-4">
            <div className="col-12">
              <h2>Dashboard Statistics</h2>
            </div>
          </div>
          
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <StatsCard
                title="Total Users"
                value={stats.totalUsers}
                icon="👥"
                color="primary"
                loading={loading}
              />
            </div>
            <div className="col-md-3">
              <StatsCard
                title="Active Listings"
                value={stats.activeListings}
                icon="📋"
                color="success"
                loading={loading}
              />
            </div>
            <div className="col-md-3">
              <StatsCard
                title="Total Bookings"
                value={stats.totalBookings}
                icon="📅"
                color="info"
                loading={loading}
              />
            </div>
            <div className="col-md-3">
              <StatsCard
                title="Revenue"
                value={`PKR ${stats.revenue.toLocaleString()}`}
                icon="💰"
                color="warning"
                loading={loading}
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <DashboardWidget title="Quick Actions">
                <QuickActions />
              </DashboardWidget>
            </div>
            <div className="col-md-6">
              <DashboardWidget title="Recent Activity">
                <ActivityFeed />
              </DashboardWidget>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Quick Actions Component
function QuickActions() {
  const actions = [
    { label: 'View Users', icon: '👥', link: '/admin/users.html' },
    { label: 'Manage Listings', icon: '📋', link: '/admin/listings.html' },
    { label: 'Handle Disputes', icon: '⚠️', link: '/admin/disputes.html' },
    { label: 'View Statistics', icon: '📊', link: '/admin/statistics.html' }
  ];

  return (
    <div className="quick-actions">
      {actions.map((action, index) => (
        <a
          key={index}
          href={action.link}
          className="action-btn"
        >
          <span className="action-icon">{action.icon}</span>
          <span className="action-label">{action.label}</span>
        </a>
      ))}
    </div>
  );
}

export default App;

