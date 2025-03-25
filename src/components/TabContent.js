import React, { useState, useEffect } from 'react';
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
  const [parsedSectionCode, setParsedSectionCode] = useState('');
  const [enhancedSectionCode, setEnhancedSectionCode] = useState('');

  // Remove the useEffect that fetches JSON files since we now get them from props

  // Extract section code from filename
  useEffect(() => {
    if (selectedParsedFile) {
      const match = selectedParsedFile.match(/_([A-Z]+\d+)_/);
      setParsedSectionCode(match ? match[1] : '');
    }
  }, [selectedParsedFile]);

  useEffect(() => {
    if (selectedEnhancedFile) {
      const match = selectedEnhancedFile.match(/_([A-Z]+\d+)_/);
      setEnhancedSectionCode(match ? match[1] : '');
    }
  }, [selectedEnhancedFile]);

  // Add debug logging
  useEffect(() => {
    console.log('TabContent received JSON files:', {
      parsed: parsedJsons,
      enhanced: enhancedJsons,
      folderPath,
      pdfFilename
    });
  }, [parsedJsons, enhancedJsons, folderPath, pdfFilename]);

  const handleProcessParsedJson = async () => {
    if (!selectedParsedFile || !folderPath) {
      console.log('❌ Missing required data:', { selectedParsedFile, folderPath });
      return;
    }

    setIsLoadingParsed(true);
    try {
      // Build the complete path for the JSON file
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

      // Update the table state with the new data
      handleTab4StateChange({ 
        ...tab4State,
        data: data.results || []
      });
    } catch (error) {
      console.error('❌ Error processing JSON:', error);
    } finally {
      setIsLoadingParsed(false);
    }
  };

  const handleProcessEnhancedJson = async () => {
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
  };

  // Update the renderHtmlContent function to show a more informative message
  const renderHtmlContent = (content) => {
    if (!content) {
      return (
        <div className="alert alert-info text-center">
          <p>No content available</p>
          <small className="d-block mt-2">Select a PDF file to view its HTML content</small>
        </div>
      );
    }
    
    return (
      <div 
        className="html-content"
        style={{ 
          height: 'calc(100vh - 250px)', // Adjust height to fit viewport
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
    <div style={{ height: '100%' }}>
      <h4>Basic HTML View</h4>
      {renderHtmlContent(htmlContents[0])}
    </div>
  );

  const renderTab4Content = () => (
    <div className="json-viewer" style={{ border: '1px solid #ccc', padding: '10px', height: 'calc(100% - 60px)', overflow: 'auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>JSON Viewer - Tab 4 (Parsed JSON)</h4>
        <button 
          className="save-display-button"
          onClick={() => console.log('Save preferences for section:', 'TAB4')}
        >
          Save Display
        </button>
      </div>
      <JsonFileSelector 
        jsonFiles={parsedJsons}
        selectedFile={selectedParsedFile}
        onFileSelect={setSelectedParsedFile}
        sectionCode={parsedSectionCode}
        onProcessFile={handleProcessParsedJson}
        isLoading={isLoadingParsed}
      />
      {tab4State.data && tab4State.data.length > 0 ? (
        <div className="table-view">
          <FlatDataTable 
            key="tab4-table"
            data={tab4State.data}
            sectionCode="TAB4"
            showColumnSelection={true}
            allowTextWrapping={true}  // Changed this
            showColorHighlighting={true}  // Changed this
            initialColumnVisibility={tab4State.columnVisibility}
            onStateChange={handleTab4StateChange}
            title="Flat Data View (TAB4)"
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
    <div className="json-viewer" style={{ border: '1px solid #ccc', padding: '10px', height: 'calc(100% - 60px)', overflow: 'auto' }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4>JSON Viewer - Tab 5 (Enhanced JSON)</h4>
        <button 
          className="save-display-button"
          onClick={() => console.log('Save preferences for section:', 'TAB5')}
        >
          Save Display
        </button>
      </div>
      <JsonFileSelector 
        jsonFiles={enhancedJsons}
        selectedFile={selectedEnhancedFile}
        onFileSelect={setSelectedEnhancedFile}
        sectionCode={enhancedSectionCode}
        onProcessFile={handleProcessEnhancedJson}
        isLoading={isLoadingEnhanced}
      />
      {tab5State.data && tab5State.data.length > 0 ? (
        <div className="table-view">
          <FlatDataTable 
            key="tab5-table"
            data={tab5State.data}
            sectionCode="TAB5"
            showColumnSelection={true}
            allowTextWrapping={true}  // Change this from tab5State.wrapText to true
            showColorHighlighting={true}  // Change this from tab5State.filterColoredText to true
            initialColumnVisibility={tab5State.columnVisibility}
            onStateChange={handleTab5StateChange}
            title="Flat Data View (TAB5)"
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