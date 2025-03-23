import React, { useState, useRef } from 'react';
import { FlatDataTable } from './FlatDataTable';
import { JsonProcessor } from '../utils/JsonProcessor';
import { Toast } from './Toast';

export const TabPanel = ({ 
  results, 
  activeFile, 
  activeTab, 
  onFileSelect, 
  onTabSelect, 
  getActiveFileData 
}) => {
  const processor = new JsonProcessor();
  const [toast, setToast] = useState(null);
  const flatDataTableRef = useRef();

  // Function to save display preferences
  const handleSaveDisplay = async () => {
    const activeData = getActiveFileData();
    if (!activeData) {
      setToast({
        type: 'error',
        message: 'No active file data found'
      });
      return;
    }

    const sectionCode = processor.extractSectionCode(activeData.name);
    if (!sectionCode) {
      setToast({
        type: 'error',
        message: 'No section code found in filename'
      });
      return;
    }

    // Get current display preferences from FlatDataTable component
    const displayPreferences = {
      sectionCode,
      selectedColumns: flatDataTableRef.current?.getSelectedColumns() || {},
      columnWidths: flatDataTableRef.current?.getColumnWidths() || {},
      timestamp: new Date().toISOString()
    };

    // Log the preferences being saved
    console.log('Saving display preferences:', displayPreferences);

    try {
      const response = await fetch('http://localhost:3001/api/save-display-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(displayPreferences)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      // Show success toast with file location
      setToast({
        type: 'success',
        message: `Display preferences saved successfully!\nLocation: server/preferences/${sectionCode}.json`
      });
    } catch (error) {
      console.error('Error saving display preferences:', error);
      setToast({
        type: 'error',
        message: `Failed to save display preferences: ${error.message}\nMake sure the server is running on port 3001`
      });
    }
  };

  return (
    <>
      <div className="file-tabs">
        {results.map((file, index) => {
          const sectionCode = processor.extractSectionCode(file.name);
          return (
            <div key={index} className="file-tab-container">
              <button
                className={`file-tab ${activeFile === index ? 'active' : ''}`}
                onClick={() => onFileSelect(index)}
              >
                {file.name}
              </button>
              {sectionCode && (
                <span className="section-code-badge">
                  {sectionCode}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="tab-controls">
        <div className="tab-buttons-group">
          <button
            className={`tab-button ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => onTabSelect('results')}
          >
            Results
          </button>
          <button
            className={`tab-button ${activeTab === 'table' ? 'active' : ''}`}
            onClick={() => onTabSelect('table')}
          >
            Table View
          </button>
          <button
            className={`tab-button ${activeTab === 'schema' ? 'active' : ''}`}
            onClick={() => onTabSelect('schema')}
          >
            Schema
          </button>
        </div>

        {activeTab === 'table' && (
          <div className="display-controls">
            <button 
              className="save-display-button"
              onClick={handleSaveDisplay}
              title="Save current column selections and widths for this section"
            >
              Save Display
            </button>
          </div>
        )}
      </div>
      
      <div className="results-view">
        {getActiveFileData() && (
          <>
            {activeTab === 'results' && (
              <div className="json-view">
                <h3>Processed Items: {getActiveFileData().data.results.length}</h3>
                <pre>{JSON.stringify(getActiveFileData().data.results, null, 2)}</pre>
              </div>
            )}
            
            {activeTab === 'table' && (
              <div className="table-view">
                <FlatDataTable 
                  ref={flatDataTableRef}
                  data={getActiveFileData().data.results}
                  sectionCode={processor.extractSectionCode(getActiveFileData().name)}
                />
              </div>
            )}
            
            {activeTab === 'schema' && (
              <div className="json-view">
                <h3>Detected Schema</h3>
                <pre>{JSON.stringify(getActiveFileData().data.schema, null, 2)}</pre>
              </div>
            )}
          </>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={5000}
        />
      )}
    </>
  );
}; 