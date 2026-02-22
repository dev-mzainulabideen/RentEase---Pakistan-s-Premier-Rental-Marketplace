import React from 'react';
import './StatsCard.css';

function StatsCard({ title, value, icon, color = 'primary', loading = false }) {
  return (
    <div className={`stats-card stats-card-${color}`}>
      <div className="stats-card-content">
        <div className="stats-card-icon">{icon}</div>
        <div className="stats-card-info">
          <h4 className="stats-card-title">{title}</h4>
          {loading ? (
            <div className="stats-card-loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="stats-card-value">{value}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatsCard;

