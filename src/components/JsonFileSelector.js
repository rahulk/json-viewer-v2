import React from 'react';
import PropTypes from 'prop-types';

export const JsonFileSelector = ({
  jsonFiles = [],
  selectedFile = '',
  onFileSelect,
  onProcessFile,
  isLoading = false
}) => {
  return (
    <div className="d-flex align-items-center gap-3 mb-3">
      <select 
        className="form-select" 
        style={{ maxWidth: '300px' }}
        value={selectedFile || ''}
        onChange={(e) => onFileSelect(e.target.value)}
      >
        <option value="">Select Section Code</option>
        {jsonFiles.map((file, index) => (
          <option key={index} value={file.filename}>
            {file.sectionCode}
          </option>
        ))}
      </select>
      
      <button 
        className="btn btn-primary"
        onClick={onProcessFile}
        disabled={!selectedFile || isLoading}
      >
        {isLoading ? (
          <>
            <span className="spinner-border spinner-border-sm" />
            <span>Processing...</span>
          </>
        ) : (
          'Process File'
        )}
      </button>
    </div>
  );
}; 