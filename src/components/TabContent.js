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
  // Remove unused state variables
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

  const renderHtmlContent = (content, title) => (
    <div className="html-viewer" style={{ border: '1px solid #ccc', padding: '10px', height: 'calc(100% - 60px)', overflow: 'auto' }}>
      <h4>{title}</h4>
      <div 
        style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
        dangerouslySetInnerHTML={{ __html: content }}
      ></div>
    </div>
  );

  const renderTab4Content = () => (
    <div className="json-viewer" style={{ border: '1px solid #ccc', padding: '10px', height: 'calc(100% - 60px)', overflow: 'auto' }}>
      <h4>JSON Viewer - Tab 4 (Parsed JSON)</h4>
      <JsonFileSelector 
        jsonFiles={parsedJsons}
        selectedFile={selectedParsedFile}
        onFileSelect={setSelectedParsedFile}
        sectionCode={parsedSectionCode}
        onProcessFile={async () => {
          setIsLoadingParsed(true);
          try {
            const response = await fetch(
              `http://localhost:3001/api/process-json?filePath=${encodeURIComponent(folderPath)}&fileName=${encodeURIComponent(selectedParsedFile)}`
            );
            const data = await response.json();
            handleTab4StateChange({ data: data.results || [] });
          } catch (error) {
            console.error('Error processing JSON file:', error);
          } finally {
            setIsLoadingParsed(false);
          }
        }}
        isLoading={isLoadingParsed}
      />
      {tab4State.data && tab4State.data.length > 0 ? (
        <div className="table-view">
          <FlatDataTable 
            key="tab4-table"
            data={tab4State.data}
            sectionCode="TAB4"
            showColumnSelection={true}
            allowTextWrapping={tab4State.wrapText}
            showColorHighlighting={tab4State.filterColoredText}
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
      <h4>JSON Viewer - Tab 5 (Enhanced JSON)</h4>
      <JsonFileSelector 
        jsonFiles={enhancedJsons}
        selectedFile={selectedEnhancedFile}
        onFileSelect={setSelectedEnhancedFile}
        sectionCode={enhancedSectionCode}
        onProcessFile={async () => {
          setIsLoadingEnhanced(true);
          try {
            const response = await fetch(
              `http://localhost:3001/api/process-json?filePath=${encodeURIComponent(folderPath)}&fileName=${encodeURIComponent(selectedEnhancedFile)}`
            );
            const data = await response.json();
            handleTab5StateChange({ data: data.results || [] });
          } catch (error) {
            console.error('Error processing JSON file:', error);
          } finally {
            setIsLoadingEnhanced(false);
          }
        }}
        isLoading={isLoadingEnhanced}
      />
      {tab5State.data && tab5State.data.length > 0 ? (
        <div className="table-view">
          <FlatDataTable 
            key="tab5-table"
            data={tab5State.data}
            sectionCode="TAB5"
            showColumnSelection={true}
            allowTextWrapping={tab5State.wrapText}
            showColorHighlighting={tab5State.filterColoredText}
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
      return renderHtmlContent(htmlContents[0], 'HTML Viewer - Tab 1');
    case 1:
      return renderHtmlContent(htmlContents[1], 'HTML Viewer - Tab 2');
    case 2:
      return renderHtmlContent(htmlContents[2], 'HTML Viewer - Tab 3');
    case 3:
      return renderTab4Content();
    case 4:
      return renderTab5Content();
    default:
      return null;
  }
};