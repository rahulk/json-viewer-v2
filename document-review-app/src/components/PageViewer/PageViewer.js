import React from 'react';
import './PageViewer.css';

const PageViewer = () => {
  return (
    <div className="page-viewer">
      <div className="document-controls">
        <button className="control-button">Zoom In</button>
        <button className="control-button">Zoom Out</button>
        <button className="control-button">Next Page</button>
        <button className="control-button">Previous Page</button>
      </div>
      <div className="document-page">
        <div className="page-placeholder">
          <p>Page Viewer Placeholder</p>
          <p>PDF content would appear here</p>
        </div>
      </div>
    </div>
  );
};

export default PageViewer;