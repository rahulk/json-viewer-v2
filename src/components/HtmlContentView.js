import React from 'react';

/**
 * Component for displaying HTML content
 * @param {Object} props - Component props
 * @param {string} props.content - HTML content to display
 */
export const HtmlContentView = ({ content }) => {
  if (!content) {
    return (
      <div className="alert alert-info text-center h-100 d-flex align-items-center justify-content-center">
        <div>
          <p>No content available</p>
          <small className="d-block mt-2">Select a PDF file to view its HTML content</small>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="html-content"
      style={{ 
        height: '100%',
        overflow: 'auto',
        overflowY: 'auto',
        overflowX: 'visible', /* Allow horizontal overflow */
        padding: '15px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        backgroundColor: '#fff',
        boxShadow: 'inset 0 0 5px rgba(0,0,0,0.1)'
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}; 