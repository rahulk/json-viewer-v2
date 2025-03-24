import React from 'react';

export const FileUploader = ({ onFileChange, onProcess, isLoading, error }) => {
  const handleFileChange = (e) => {
    onFileChange(e.target.files);
  };

  return (
    <div className="card p-3 mb-3 bg-light">
      <div className="d-flex flex-wrap align-items-center">
        <div className="me-3 mb-2">
          <label className="form-label mb-0 fw-bold">Select JSON Files</label>
        </div>
        
        <div className="me-3 mb-2">
          <input 
            type="file" 
            accept=".json" 
            multiple 
            onChange={handleFileChange}
            className="form-control form-control-sm" 
          />
        </div>
        
        <div className="me-3 mb-2">
          <span>Or use</span>
        </div>
        
        <div className="me-3 mb-2">
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => onFileChange([])}
          >
            sample data
          </button>
        </div>
        
        <div className="mb-2">
          <button 
            className="btn btn-success btn-sm"
            onClick={onProcess}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Process Files'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="alert alert-danger mt-2 mb-0">
          {error}
        </div>
      )}
    </div>
  );
}; 