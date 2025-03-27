import React from 'react';

/**
 * Component displayed when no data is loaded
 * @param {Object} props - Component props
 * @param {string} props.title - Title to display
 * @param {string} props.sectionCode - Current section code (if any)
 * @param {boolean} props.isLoading - Whether data is loading
 * @param {Function} props.onLoadData - Function to call to load data
 * @param {Function} props.onLoadSampleData - Function to call to load sample data
 */
export const EmptyDataView = ({
  title,
  sectionCode,
  isLoading,
  onLoadData,
  onLoadSampleData
}) => {
  return (
    <div className="card p-4 text-center" style={{ backgroundColor: '#f9f9f9' }}>
      <div className="mb-3">
        <i className="bi bi-table fs-1 text-muted"></i>
      </div>
      <h5>{title || 'No Data Loaded'}</h5>
      {sectionCode ? (
        <>
          <p className="text-muted mb-3">
            You've selected section code <strong>{sectionCode}</strong>.<br/>
            Click "Load Data" to view the contents and apply any saved display settings.
          </p>
          <button 
            className="btn btn-primary"
            onClick={onLoadData}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Loading...
              </>
            ) : (
              'Load Data'
            )}
          </button>
        </>
      ) : (
        <>
          <p className="text-muted mb-3">
            Select a section code from the dropdown above to get started.
          </p>
          <div className="text-muted small">
            <strong>OR</strong>
          </div>
          <button 
            className="btn btn-outline-secondary mt-2"
            onClick={onLoadSampleData}
          >
            Load Sample Data
          </button>
        </>
      )}
    </div>
  );
}; 