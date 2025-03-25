import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FlatDataTable } from './FlatDataTable';
import { JsonFileSelector } from './common/JsonFileSelector';

export const TabContent = ({ 
  selectedTab, 
  htmlContents, 
  tab4State, 
  tab5State, 
  handleTab4StateChange, 
  handleTab5StateChange,
  processFiles,
  folderPath,
  pdfFilename,
  parsedJsons,
  enhancedJsons
}) => {
  const [selectedParsedFile, setSelectedParsedFile] = useState('');
  const [selectedEnhancedFile, setSelectedEnhancedFile] = useState('');
  const [isLoadingParsed, setIsLoadingParsed] = useState(false);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(false);
  
  // Use useRef instead of useState for refs
  const tab4Ref = useRef(null);
  const tab5Ref = useRef(null);

  // Memoize the state change handlers
  const handleTab4Change = useCallback((newState) => {
    handleTab4StateChange(prevState => ({
      ...prevState,
      columnVisibility: newState.columnVisibility || prevState.columnVisibility,
      columnWidths: newState.columnWidths || prevState.columnWidths,
      data: prevState.data // Preserve data
    }));
  }, [handleTab4StateChange]);

  const handleTab5Change = useCallback((newState) => {
    handleTab5StateChange(prevState => ({
      ...prevState,
      columnVisibility: newState.columnVisibility || prevState.columnVisibility,
      columnWidths: newState.columnWidths || prevState.columnWidths,
      data: prevState.data // Preserve data
    }));
  }, [handleTab5StateChange]);

  // Helper function to extract section code from filename
  const extractSectionCode = useCallback((filename) => {
    const match = filename.match(/_((?:ENR|AD|GEN|AMDT)_\d+(?:_\d+)?)/i);
    return match ? match[1] : null;
  }, []);

  // Function to show notification
  const showNotification = useCallback((message, isError = false) => {
    const notificationDiv = document.createElement('div');
    notificationDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: ${isError ? '#f44336' : '#4CAF50'};
      color: white;
      padding: 15px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      z-index: 1000;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;

    // Add animation keyframes
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(styleSheet);

    notificationDiv.innerHTML = message;
    document.body.appendChild(notificationDiv);

    // Remove the notification after 5 seconds with fade-out effect
    setTimeout(() => {
      notificationDiv.style.transition = 'opacity 0.5s ease-out';
      notificationDiv.style.opacity = '0';
      setTimeout(() => {
        if (notificationDiv.parentNode) {
          notificationDiv.parentNode.removeChild(notificationDiv);
        }
        styleSheet.remove();
      }, 500);
    }, 5000);
  }, []);

  // Function to save display preferences
  const saveDisplayPreferences = useCallback(async (tabType, ref, sectionCode) => {
    if (!pdfFilename || !sectionCode) {
      showNotification('❌ Cannot save preferences: Missing PDF filename or section code', true);
      return;
    }

    try {
      const selectedColumns = ref.current?.getSelectedColumns();
      const columnWidths = ref.current?.getColumnWidths();

      if (!selectedColumns || !columnWidths) {
        showNotification('❌ Cannot save preferences: Missing table state', true);
        return;
      }

      const response = await fetch('http://localhost:3001/api/save-display-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfFilename,
          sectionCode,
          tabType,
          selectedColumns,
          columnWidths
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save display preferences');
      }

      await response.json(); // Consume the response but we don't need the result

      // Create success message with file details
      const baseFilename = pdfFilename.replace(/\.pdf$/, '');
      const prefsFilename = `${baseFilename}_${sectionCode}_${tabType}.json`;
      
      const successMessage = `
        <div style="margin-bottom: 5px;"><strong>✅ Display settings saved successfully!</strong></div>
        <div style="font-size: 0.9em;">File: ${prefsFilename}</div>
        <div style="font-size: 0.9em;">Location: preferences/${prefsFilename}</div>
      `;

      showNotification(successMessage);
      console.log(`✅ Display preferences saved for ${tabType}`);
    } catch (error) {
      console.error('Error saving display preferences:', error);
      showNotification('❌ Error saving display settings', true);
    }
  }, [pdfFilename, showNotification]);

  // Function to load display preferences
  const loadDisplayPreferences = useCallback(async (tabType, sectionCode) => {
    if (!pdfFilename || !sectionCode) {
      console.log('Cannot load preferences: Missing PDF filename or section code');
      return null;
    }

    try {
      const params = new URLSearchParams({
        pdfFilename,
        sectionCode,
        tabType
      });

      const response = await fetch(`http://localhost:3001/api/display-preferences?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load display preferences');
      }

      const preferences = await response.json();
      console.log(`✅ Loaded display preferences for ${tabType}:`, preferences);
      return preferences;
    } catch (error) {
      console.error('Error loading display preferences:', error);
      return null;
    }
  }, [pdfFilename]);

  // Load preferences for Tab 4 when PDF file or section code changes
  useEffect(() => {
    const loadPrefs = async () => {
      if (selectedParsedFile) {
        const sectionCode = extractSectionCode(selectedParsedFile);
        const prefs = await loadDisplayPreferences('parsed', sectionCode);
        if (prefs) {
          handleTab4StateChange({
            ...tab4State,
            columnVisibility: prefs.selectedColumns,
            columnWidths: prefs.columnWidths
          });
        }
      }
    };
    loadPrefs();
  }, [selectedParsedFile, pdfFilename, extractSectionCode, loadDisplayPreferences, handleTab4StateChange, tab4State]);

  // Load preferences for Tab 5 when PDF file or section code changes
  useEffect(() => {
    const loadPrefs = async () => {
      if (selectedEnhancedFile) {
        const sectionCode = extractSectionCode(selectedEnhancedFile);
        const prefs = await loadDisplayPreferences('enhanced', sectionCode);
        if (prefs) {
          handleTab5StateChange({
            ...tab5State,
            columnVisibility: prefs.selectedColumns,
            columnWidths: prefs.columnWidths
          });
        }
      }
    };
    loadPrefs();
  }, [selectedEnhancedFile, pdfFilename, extractSectionCode, loadDisplayPreferences, handleTab5StateChange, tab5State]);

  // Debug logging
  useEffect(() => {
    console.log('TabContent received JSON files:', {
      parsed: parsedJsons,
      enhanced: enhancedJsons,
      folderPath,
      pdfFilename
    });
  }, [parsedJsons, enhancedJsons, folderPath, pdfFilename]);

  const handleProcessParsedJson = useCallback(async () => {
    if (!selectedParsedFile || !folderPath) {
      console.log('❌ Missing required data:', { selectedParsedFile, folderPath });
      return;
    }

    setIsLoadingParsed(true);
    try {
      const jsonPath = `${folderPath}/parsed_jsons/${selectedParsedFile}`;
      console.log('📤 Making API call to process JSON:', {
        endpoint: '/api/process-json',
        path: jsonPath
      });

      const response = await fetch(
        `http://localhost:3001/api/process-json?filePath=${encodeURIComponent(jsonPath)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API error:', errorData);
        throw new Error(`Failed to process JSON: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Received JSON data:', {
        records: Array.isArray(data.results) ? data.results.length : 'Not an array',
        success: data.success
      });

      handleTab4StateChange({ 
        ...tab4State,
        data: data.results || []
      });
    } catch (error) {
      console.error('❌ Error processing JSON:', error);
    } finally {
      setIsLoadingParsed(false);
    }
  }, [selectedParsedFile, folderPath, handleTab4StateChange, tab4State]);

  const handleProcessEnhancedJson = useCallback(async () => {
    if (!selectedEnhancedFile || !folderPath) {
      console.log('❌ Missing required data for enhanced JSON:', { selectedEnhancedFile, folderPath });
      return;
    }

    setIsLoadingEnhanced(true);
    try {
      const jsonPath = `${folderPath}/enhanced_jsons/${selectedEnhancedFile}`;
      console.log('📤 Processing enhanced JSON:', jsonPath);

      const response = await fetch(
        `http://localhost:3001/api/process-json?filePath=${encodeURIComponent(jsonPath)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to process enhanced JSON: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      handleTab5StateChange({ 
        ...tab5State,
        data: data.results || []
      });
    } catch (error) {
      console.error('❌ Error processing enhanced JSON:', error);
    } finally {
      setIsLoadingEnhanced(false);
    }
  }, [selectedEnhancedFile, folderPath, handleTab5StateChange, tab5State]);

  // Update the renderHtmlContent function to show a more informative message
  const renderHtmlContent = (content) => {
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

  const renderTab1Content = () => (
    <div style={{ height: '100%', overflow: 'hidden' }}>
      <h4>Basic HTML View</h4>
      {renderHtmlContent(htmlContents[0])}
    </div>
  );

  const renderTab4Content = () => (
    <div className="json-viewer" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Parsed JSONs</h4>
        <button 
          className="save-display-button"
          onClick={() => {
            const sectionCode = selectedParsedFile ? extractSectionCode(selectedParsedFile) : null;
            if (sectionCode) {
              saveDisplayPreferences('parsed', tab4Ref, sectionCode);
            }
          }}
          disabled={!selectedParsedFile}
        >
          Save Display
        </button>
      </div>
      <JsonFileSelector 
        jsonFiles={parsedJsons}
        selectedFile={selectedParsedFile}
        onFileSelect={setSelectedParsedFile}
        onProcessFile={handleProcessParsedJson}
        isLoading={isLoadingParsed}
      />
      {tab4State.data && tab4State.data.length > 0 ? (
        <div className="table-view" style={{ flex: 1, overflow: 'hidden' }}>
          <FlatDataTable 
            ref={tab4Ref}
            key={`tab4-table-${selectedParsedFile}`}
            data={tab4State.data}
            sectionCode={selectedParsedFile ? extractSectionCode(selectedParsedFile) : null}
            showColumnSelection={true}
            allowTextWrapping={true}
            showColorHighlighting={false}
            initialColumnVisibility={tab4State.columnVisibility}
            onStateChange={handleTab4Change}
            title=""
          />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>No data available for Tab 4. Please select a file and click "Process Files".</p>
          <button 
            className="btn btn-primary mt-2"
            onClick={processFiles}
          >
            Load Sample Data
          </button>
        </div>
      )}
    </div>
  );

  const renderTab5Content = () => (
    <div className="json-viewer" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>Enhanced JSONs</h4>
        <button 
          className="save-display-button"
          onClick={() => {
            const sectionCode = selectedEnhancedFile ? extractSectionCode(selectedEnhancedFile) : null;
            if (sectionCode) {
              saveDisplayPreferences('enhanced', tab5Ref, sectionCode);
            }
          }}
          disabled={!selectedEnhancedFile}
        >
          Save Display
        </button>
      </div>
      <JsonFileSelector 
        jsonFiles={enhancedJsons}
        selectedFile={selectedEnhancedFile}
        onFileSelect={setSelectedEnhancedFile}
        onProcessFile={handleProcessEnhancedJson}
        isLoading={isLoadingEnhanced}
      />
      {tab5State.data && tab5State.data.length > 0 ? (
        <div className="table-view" style={{ flex: 1, overflow: 'hidden' }}>
          <FlatDataTable 
            ref={tab5Ref}
            key={`tab5-table-${selectedEnhancedFile}`}
            data={tab5State.data}
            sectionCode={selectedEnhancedFile ? extractSectionCode(selectedEnhancedFile) : null}
            showColumnSelection={true}
            allowTextWrapping={true}
            showColorHighlighting={true}
            initialColumnVisibility={tab5State.columnVisibility}
            onStateChange={handleTab5Change}
            title=""
          />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>No data available for Tab 5. Please select a file and click "Process Files".</p>
          <button 
            className="btn btn-primary mt-2"
            onClick={processFiles}
          >
            Load Sample Data
          </button>
        </div>
      )}
    </div>
  );

  // Use separate render functions for each tab to ensure complete separation
  switch (selectedTab) {
    case 0:
      return renderTab1Content();
    case 1:
      return renderHtmlContent(htmlContents[1]);
    case 2:
      return renderHtmlContent(htmlContents[2]);
    case 3:
      return renderTab4Content();
    case 4:
      return renderTab5Content();
    default:
      return null;
  }
};