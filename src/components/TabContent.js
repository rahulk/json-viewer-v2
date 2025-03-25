import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  const previousParsedSectionCode = useRef(null);
  const previousEnhancedSectionCode = useRef(null);

  // Add state to track mounting keys, but make them fixed for each table to preserve state
  const tab4Key = useMemo(() => `tab4-fixed-instance`, []);
  const tab5Key = useMemo(() => `tab5-fixed-instance`, []);
  
  // Track previous tab selection to detect tab changes
  const prevSelectedTabRef = useRef(selectedTab);
  
  // Track tab switches for debugging
  useEffect(() => {
    if (prevSelectedTabRef.current !== selectedTab) {
      console.log(`Tab changed from ${prevSelectedTabRef.current} to ${selectedTab}`);
      prevSelectedTabRef.current = selectedTab;
    }
  }, [selectedTab]);

  // Memoize the state change handlers - don't automatically preserve data
  const handleTab4Change = useCallback((newState) => {
    handleTab4StateChange(prevState => ({
      ...prevState,
      ...newState
      // No longer forcing data preservation
    }));
  }, [handleTab4StateChange]);

  const handleTab5Change = useCallback((newState) => {
    handleTab5StateChange(prevState => ({
      ...prevState,
      ...newState
      // No longer forcing data preservation
    }));
  }, [handleTab5StateChange]);

  // Helper function to extract section code from filename
  const extractSectionCode = useCallback((filename) => {
    const match = filename.match(/_((?:ENR|AD|GEN|AMDT)_\d+(?:_\d+)?)/i);
    return match ? match[1] : null;
  }, []);

  // Custom handler for parsed file selection to ONLY reset state on section code change
  const handleParsedFileSelect = useCallback((filename) => {
    const newSectionCode = extractSectionCode(filename);
    const currentSectionCode = previousParsedSectionCode.current;
    
    if (newSectionCode !== currentSectionCode) {
      console.log(`Section code changed from ${currentSectionCode} to ${newSectionCode}, completely resetting Tab 4 state`);
      
      // First, update the section code reference
      previousParsedSectionCode.current = newSectionCode;
      
      // Reset EVERYTHING including the entire tab state
      handleTab4StateChange({
        data: [], // Empty the data completely
        columnVisibility: {},
        columnWidths: {},
        columnOrder: [],
        wrapText: false,
        filterColoredText: false
      });
    }
    
    setSelectedParsedFile(filename);
  }, [extractSectionCode, handleTab4StateChange]);
  
  // Custom handler for enhanced file selection to ONLY reset state on section code change
  const handleEnhancedFileSelect = useCallback((filename) => {
    const newSectionCode = extractSectionCode(filename);
    const currentSectionCode = previousEnhancedSectionCode.current;
    
    if (newSectionCode !== currentSectionCode) {
      console.log(`Section code changed from ${currentSectionCode} to ${newSectionCode}, completely resetting Tab 5 state`);
      
      // First, update the section code reference
      previousEnhancedSectionCode.current = newSectionCode;
      
      // Reset EVERYTHING including the entire tab state
      handleTab5StateChange({
        data: [], // Empty the data completely
        columnVisibility: {},
        columnWidths: {},
        columnOrder: [],
        wrapText: false,
        filterColoredText: false
      });
    }
    
    setSelectedEnhancedFile(filename);
  }, [extractSectionCode, handleTab5StateChange]);

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

  // Function to save display preferences - UPDATED to include columnOrder and columnWidths
  const saveDisplayPreferences = useCallback(async (tabType, ref, sectionCode) => {
    if (!pdfFilename || !sectionCode) {
      showNotification('❌ Cannot save preferences: Missing PDF filename or section code', true);
      return;
    }

    try {
      const selectedColumns = ref.current?.getSelectedColumns();
      const columnWidths = ref.current?.getColumnWidths();
      const columnOrder = ref.current?.getColumnOrder();

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
          columnWidths,
          columnOrder
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

  // Updated to load preferences after processing the JSON
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

      // Update the data first
      handleTab4StateChange({
        data: data.results || []
      });

      // Then load and apply saved preferences for this section code
      const sectionCode = extractSectionCode(selectedParsedFile);
      if (sectionCode) {
        try {
          console.log(`Loading preferences for section: ${sectionCode} after processing data`);
          const prefs = await loadDisplayPreferences('parsed', sectionCode);
          
          if (prefs && Object.keys(prefs).length > 0) {
            console.log('Found saved preferences, applying them:', prefs);
            
            handleTab4StateChange({
              columnVisibility: prefs.selectedColumns || {},
              columnWidths: prefs.columnWidths || {},
              columnOrder: prefs.columnOrder || []
            });
          } else {
            console.log('No saved preferences found, using defaults');
          }
        } catch (error) {
          console.error('Error loading preferences:', error);
        }
      }
    } catch (error) {
      console.error('❌ Error processing JSON:', error);
    } finally {
      setIsLoadingParsed(false);
    }
  }, [selectedParsedFile, folderPath, extractSectionCode, loadDisplayPreferences, handleTab4StateChange]);

  // Updated to load preferences after processing the JSON
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
      
      // Update the data first
      handleTab5StateChange({
        data: data.results || []
      });
      
      // Then load and apply saved preferences for this section code
      const sectionCode = extractSectionCode(selectedEnhancedFile);
      if (sectionCode) {
        try {
          console.log(`Loading preferences for section: ${sectionCode} after processing data`);
          const prefs = await loadDisplayPreferences('enhanced', sectionCode);
          
          if (prefs && Object.keys(prefs).length > 0) {
            console.log('Found saved preferences, applying them:', prefs);
            
            handleTab5StateChange({
              columnVisibility: prefs.selectedColumns || {},
              columnWidths: prefs.columnWidths || {},
              columnOrder: prefs.columnOrder || []
            });
          } else {
            console.log('No saved preferences found, using defaults');
          }
        } catch (error) {
          console.error('Error loading preferences:', error);
        }
      }
    } catch (error) {
      console.error('❌ Error processing enhanced JSON:', error);
    } finally {
      setIsLoadingEnhanced(false);
    }
  }, [selectedEnhancedFile, folderPath, extractSectionCode, loadDisplayPreferences, handleTab5StateChange]);

  // Debug logging
  useEffect(() => {
    console.log('TabContent received JSON files:', {
      parsed: parsedJsons,
      enhanced: enhancedJsons,
      folderPath,
      pdfFilename
    });
  }, [parsedJsons, enhancedJsons, folderPath, pdfFilename]);

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

  const renderTab1Content = () => (
    <div style={{ 
      height: '100%', 
      overflow: 'visible'
    }}>
      {renderHtmlContent(htmlContents[0])}
    </div>
  );

  const renderTab2Content = () => (
    <div style={{ 
      height: '100%', 
      overflow: 'visible'
    }}>
      {renderHtmlContent(htmlContents[1])}
    </div>
  );

  const renderTab3Content = () => (
    <div style={{ 
      height: '100%', 
      overflow: 'visible'
    }}>
      {renderHtmlContent(htmlContents[2])}
    </div>
  );

  // Memoize the FlatDataTable components to preserve them across tab changes
  const parsedFlatDataTable = useMemo(() => (
    <FlatDataTable 
      ref={tab4Ref}
      key={tab4Key}
      componentId="parsed-table"
      data={tab4State.data}
      sectionCode={extractSectionCode(selectedParsedFile)}
      showColumnSelection={true}
      allowTextWrapping={true}
      showColorHighlighting={false}
      initialColumnVisibility={tab4State.columnVisibility}
      initialColumnWidths={tab4State.columnWidths}
      initialColumnOrder={tab4State.columnOrder}
      onStateChange={handleTab4Change}
      title=""
    />
  ), [
    tab4Key, 
    tab4State.data, 
    tab4State.columnVisibility, 
    tab4State.columnWidths, 
    tab4State.columnOrder, 
    selectedParsedFile, 
    handleTab4Change, 
    extractSectionCode
  ]);

  const enhancedFlatDataTable = useMemo(() => (
    <FlatDataTable 
      ref={tab5Ref}
      key={tab5Key}
      componentId="enhanced-table"
      data={tab5State.data}
      sectionCode={extractSectionCode(selectedEnhancedFile)}
      showColumnSelection={true}
      allowTextWrapping={true}
      showColorHighlighting={true}
      initialColumnVisibility={tab5State.columnVisibility}
      initialColumnWidths={tab5State.columnWidths}
      initialColumnOrder={tab5State.columnOrder}
      onStateChange={handleTab5Change}
      title=""
    />
  ), [
    tab5Key, 
    tab5State.data, 
    tab5State.columnVisibility, 
    tab5State.columnWidths, 
    tab5State.columnOrder, 
    selectedEnhancedFile, 
    handleTab5Change, 
    extractSectionCode
  ]);

  const renderTab4Content = () => (
    <div style={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'visible'
    }}>
      <div style={{ 
        marginBottom: '16px', 
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1, maxWidth: '100%' }}>
          <div style={{ flexGrow: 1, maxWidth: '300px' }}>
            <JsonFileSelector
              jsonFiles={parsedJsons}
              selectedFile={selectedParsedFile}
              onFileSelect={handleParsedFileSelect}
              isLoading={isLoadingParsed}
              onProcessFile={handleProcessParsedJson}
            />
          </div>
          <button
            className="btn btn-outline-secondary ms-2"
            onClick={() => saveDisplayPreferences('parsed', tab4Ref, extractSectionCode(selectedParsedFile))}
            disabled={!selectedParsedFile || !tab4State.data || tab4State.data.length === 0}
            style={{ whiteSpace: 'nowrap' }}
          >
            Save Display Settings
          </button>
        </div>
        
        {/* Add simple workflow instructions */}
        <div className="small text-muted">
          <strong>How to use:</strong> 1) Select a section code from the dropdown 2) Click "Process File" to load data and apply saved view settings
        </div>
      </div>

      {tab4State.data && tab4State.data.length > 0 ? (
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 220px)', /* Updated to account for the instructions */
          overflow: 'visible',
          position: 'relative',
          backgroundColor: '#fff',
          borderRadius: '4px',
          border: '1px solid #ddd',
          minHeight: '0',
          minWidth: '0'
        }}>
          {parsedFlatDataTable}
        </div>
      ) : (
        <div className="card p-4 text-center" style={{ backgroundColor: '#f9f9f9' }}>
          <div className="mb-3">
            <i className="bi bi-table fs-1 text-muted"></i>
          </div>
          <h5>No Data Loaded</h5>
          {selectedParsedFile ? (
            <>
              <p className="text-muted mb-3">
                You've selected section code <strong>{extractSectionCode(selectedParsedFile)}</strong>.<br/>
                Click "Load Data" to view the contents and apply any saved display settings.
              </p>
              <button 
                className="btn btn-primary"
                onClick={handleProcessParsedJson}
                disabled={isLoadingParsed}
              >
                {isLoadingParsed ? (
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
                onClick={processFiles}
              >
                Load Sample Data
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  const renderTab5Content = () => (
    <div style={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'visible'
    }}>
      <div style={{ 
        marginBottom: '16px', 
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1, maxWidth: '100%' }}>
          <div style={{ flexGrow: 1, maxWidth: '300px' }}>
            <JsonFileSelector
              jsonFiles={enhancedJsons}
              selectedFile={selectedEnhancedFile}
              onFileSelect={handleEnhancedFileSelect}
              isLoading={isLoadingEnhanced}
              onProcessFile={handleProcessEnhancedJson}
            />
          </div>
          <button
            className="btn btn-outline-secondary ms-2"
            onClick={() => saveDisplayPreferences('enhanced', tab5Ref, extractSectionCode(selectedEnhancedFile))}
            disabled={!selectedEnhancedFile || !tab5State.data || tab5State.data.length === 0}
            style={{ whiteSpace: 'nowrap' }}
          >
            Save Display Settings
          </button>
        </div>
        
        {/* Add simple workflow instructions */}
        <div className="small text-muted">
          <strong>How to use:</strong> 1) Select a section code from the dropdown 2) Click "Process File" to load data and apply saved view settings
        </div>
      </div>

      {tab5State.data && tab5State.data.length > 0 ? (
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 220px)', /* Updated to account for the instructions */
          overflow: 'visible',
          position: 'relative',
          backgroundColor: '#fff',
          borderRadius: '4px',
          border: '1px solid #ddd',
          minHeight: '0',
          minWidth: '0'
        }}>
          {enhancedFlatDataTable}
        </div>
      ) : (
        <div className="card p-4 text-center" style={{ backgroundColor: '#f9f9f9' }}>
          <div className="mb-3">
            <i className="bi bi-table fs-1 text-muted"></i>
          </div>
          <h5>No Enhanced Data Loaded</h5>
          {selectedEnhancedFile ? (
            <>
              <p className="text-muted mb-3">
                You've selected section code <strong>{extractSectionCode(selectedEnhancedFile)}</strong>.<br/>
                Click "Load Data" to view the enhanced contents and apply any saved display settings.
              </p>
              <button 
                className="btn btn-primary"
                onClick={handleProcessEnhancedJson}
                disabled={isLoadingEnhanced}
              >
                {isLoadingEnhanced ? (
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
                onClick={processFiles}
              >
                Load Sample Data
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  // Use separate render functions for each tab to ensure complete separation
  switch (selectedTab) {
    case 0:
      return renderTab1Content();
    case 1:
      return renderTab2Content();
    case 2:
      return renderTab3Content();
    case 3:
      return renderTab4Content();
    case 4:
      return renderTab5Content();
    default:
      return null;
  }
};