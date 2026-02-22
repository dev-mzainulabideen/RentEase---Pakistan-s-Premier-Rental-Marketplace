import React from 'react';
import './DashboardWidget.css';

function DashboardWidget({ title, children }) {
  return (
    <div className="dashboard-widget">
      <div className="widget-header">
        <h3>{title}</h3>
      </div>
      <div className="widget-body">
        {children}
      </div>
    </div>
  );
}

export default DashboardWidget;

