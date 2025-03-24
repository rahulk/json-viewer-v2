import React from 'react';

export const Sidebar = ({ 
  folders, 
  foldersLoading, 
  foldersError, 
  pdfFiles, 
  activeFolder, 
  activePdfFile, 
  fetchFolders, 
  handleFolderSelect, 
  handlePdfFileSelect 
}) => {
  return (
    <div className="sidebar h-100">
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h2>PDF Folders</h2>
          <button 
            className="btn btn-sm btn-outline-secondary" 
            onClick={fetchFolders}
            disabled={foldersLoading}
            title="Refresh folders"
          >
            {foldersLoading ? "..." : "↻"}
          </button>
        </div>
        
        {foldersLoading ? (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading folders...</span>
            </div>
            <p className="mt-2 small text-muted">Loading folders...</p>
          </div>
        ) : foldersError ? (
          <div className="alert alert-danger py-2 small">
            {foldersError}
            <button 
              className="btn btn-sm btn-outline-danger ms-2"
              onClick={fetchFolders}
            >
              Retry
            </button>
          </div>
        ) : folders.length === 0 ? (
          <p className="text-muted small">No folders found in /documents/output</p>
        ) : (
          <ul className="list-unstyled">
            {folders.map((folder, index) => (
              <li 
                key={index} 
                className={`folder-item ${activeFolder === index ? 'active' : ''}`}
                onClick={() => handleFolderSelect(index)}
                style={{ 
                  color: '#00008B',
                  padding: '6px 8px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  marginBottom: '4px',
                  backgroundColor: activeFolder === index ? '#e9ecef' : 'transparent'
                }}
              >
                <i className="bi bi-folder-fill me-2" style={{ color: '#FFD700' }}></i>
                {folder}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div>
        <h2>PDF Files</h2>
        <ul className="list-unstyled">
          {pdfFiles.map((file, index) => (
            <li 
              key={index} 
              className={`file-item ${activePdfFile === index ? 'active' : ''}`}
              onClick={() => handlePdfFileSelect(index)}
              style={{ 
                color: '#00008B',
                padding: '6px 8px',
                cursor: 'pointer',
                borderRadius: '4px',
                marginBottom: '4px',
                backgroundColor: activePdfFile === index ? '#e9ecef' : 'transparent'
              }}
            >
              <i className="bi bi-file-pdf-fill me-2" style={{ color: '#FF0000' }}></i>
              {file}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}; 