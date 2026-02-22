import React, { useState, useEffect } from 'react';
import './ActivityFeed.css';

function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate activity feed (can be replaced with real API call)
    const fetchActivities = async () => {
      try {
        // For demo, using mock data
        // In production, fetch from: http://localhost:4001/api/admin/activity
        setTimeout(() => {
          setActivities([
            { id: 1, action: 'New user registered', time: '2 minutes ago', type: 'user' },
            { id: 2, action: 'Listing created', time: '15 minutes ago', type: 'listing' },
            { id: 3, action: 'Booking completed', time: '1 hour ago', type: 'booking' },
            { id: 4, action: 'Dispute resolved', time: '2 hours ago', type: 'dispute' },
            { id: 5, action: 'Payment processed', time: '3 hours ago', type: 'payment' }
          ]);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getActivityIcon = (type) => {
    const icons = {
      user: '👤',
      listing: '📋',
      booking: '📅',
      dispute: '⚠️',
      payment: '💰'
    };
    return icons[type] || '📌';
  };

  if (loading) {
    return (
      <div className="activity-feed-loading">
        <div className="spinner"></div>
        <p>Loading activities...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="activity-feed-empty">
        <p>No recent activities</p>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      {activities.map((activity) => (
        <div key={activity.id} className="activity-item">
          <div className="activity-icon">
            {getActivityIcon(activity.type)}
          </div>
          <div className="activity-content">
            <div className="activity-action">{activity.action}</div>
            <div className="activity-time">{activity.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ActivityFeed;

