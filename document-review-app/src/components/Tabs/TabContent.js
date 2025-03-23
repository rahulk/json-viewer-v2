import React from 'react';
import App from '../../App'; // Assuming your JSON viewer is in App.js

const TabContent = ({ tab, isJsonViewer }) => {
  if (isJsonViewer) {
    return <App />; // Use your existing JSON viewer component
  }
  
  return (
    <div className="html-viewer-placeholder">
      <h3>HTML Viewer</h3>
      <p>{tab.content}</p>
      <div className="placeholder-content">
        <div className="mock-section"></div>
        <div className="mock-section"></div>
        <div className="mock-text-lines">
          <div className="mock-line"></div>
          <div className="mock-line"></div>
          <div className="mock-line"></div>
          <div className="mock-line"></div>
        </div>
      </div>
    </div>
  );
};

export default TabContent;