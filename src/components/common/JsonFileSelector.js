import React from 'react';
import PropTypes from 'prop-types';

export const JsonFileSelector = ({
  jsonFiles = [],
  selectedFile,
  onFileSelect,
  onProcessFile,
  isLoading
}) => {
  return (
    <div className="d-flex align-items-center" style={{ gap: '8px' }}>
      <select 
        className="form-select form-select-sm" 
        style={{ width: '100%', maxWidth: '240px' }}
        value={selectedFile || ''}
        onChange={(e) => onFileSelect(e.target.value)}
      >
        <option value="">-- Select Section Code --</option>
        {(jsonFiles || []).map((file, index) => (
          <option key={index} value={file.filename}>
            {file.sectionCode}
          </option>
        ))}
      </select>
      
      <button 
        className="btn btn-primary btn-sm"
        onClick={onProcessFile}
        disabled={!selectedFile || isLoading}
        style={{ whiteSpace: 'nowrap' }}
        title="Load data and apply saved view settings for this section"
      >
        {isLoading ? (
          <>
            <span className="spinner-border spinner-border-sm me-1" />
            Loading...
          </>
        ) : (
          'Load Data'
        )}
      </button>
    </div>
  );
};

JsonFileSelector.propTypes = {
  jsonFiles: PropTypes.arrayOf(PropTypes.shape({
    filename: PropTypes.string.isRequired,
    sectionCode: PropTypes.string.isRequired
  })),
  selectedFile: PropTypes.string,
  onFileSelect: PropTypes.func.isRequired,
  onProcessFile: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

JsonFileSelector.defaultProps = {
  jsonFiles: [],
  selectedFile: '',
  isLoading: false
};