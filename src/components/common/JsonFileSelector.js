import React from 'react';
import PropTypes from 'prop-types';

export const JsonFileSelector = ({
  jsonFiles,
  selectedFile,
  onFileSelect,
  sectionCode,  // we'll keep this prop but won't display it
  onProcessFile,
  isLoading
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
      
      {/* Removed the section-code div that was here */}
      
      <button 
        className="btn btn-primary"
        onClick={onProcessFile}
        disabled={!selectedFile || isLoading}
      >
        {isLoading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" />
            Processing...
          </>
        ) : (
          'Process File'
        )}
      </button>
    </div>
  );
};

JsonFileSelector.propTypes = {
  jsonFiles: PropTypes.arrayOf(PropTypes.shape({
    filename: PropTypes.string.isRequired,
    sectionCode: PropTypes.string.isRequired
  })).isRequired,
  selectedFile: PropTypes.string,
  onFileSelect: PropTypes.func.isRequired,
  sectionCode: PropTypes.string,
  onProcessFile: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};