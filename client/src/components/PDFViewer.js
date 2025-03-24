import React, { useState, useEffect } from 'react';
import JsonSelector from './JsonSelector';
import './PdfViewer.css';

const PDFViewer = ({ pdfPath, pdfFilename }) => {
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [folderPath, setFolderPath] = useState('documents/output');
  const [selectedParsedJson, setSelectedParsedJson] = useState(null);
  const [selectedEnhancedJson, setSelectedEnhancedJson] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  // Update state when props change
  useEffect(() => {
    if (pdfFilename) {
      setSelectedPdf(pdfFilename);
    }
    
    if (pdfPath) {
      setFolderPath(pdfPath);
    }
  }, [pdfFilename, pdfPath]);
  
  // Handle parsed JSON selection
  const handleParsedJsonSelect = (jsonFilename) => {
    console.log('Parsed JSON selected:', jsonFilename);
    setSelectedParsedJson(jsonFilename);
    // Automatically switch to parsed JSON tab
    setActiveTab('parsed');
  };
  
  // Handle enhanced JSON selection
  const handleEnhancedJsonSelect = (jsonFilename) => {
    console.log('Enhanced JSON selected:', jsonFilename);
    setSelectedEnhancedJson(jsonFilename);
    // Automatically switch to enhanced JSON tab
    setActiveTab('enhancedJson');
  };
  
  // Render PDF viewer (Basic tab)
  const renderPdfViewer = () => {
    if (!selectedPdf) return <div className="no-pdf">No PDF selected</div>;
    
    // Construct PDF URL
    const pdfUrl = `/api/pdf?path=${encodeURIComponent(`${folderPath}/${selectedPdf}`)}`;
    
    return (
      <iframe
        src={pdfUrl}
        title={selectedPdf}
        className="pdf-viewer"
        width="100%"
        height="600px"
      />
    );
  };
  
  // Render modified tab content
  const renderModifiedContent = () => {
    if (!selectedPdf) return <div className="no-pdf">No PDF selected</div>;
    
    return <div className="content-placeholder">Modified view content goes here</div>;
  };
  
  // Render enhanced tab content
  const renderEnhancedContent = () => {
    if (!selectedPdf) return <div className="no-pdf">No PDF selected</div>;
    
    return <div className="content-placeholder">Enhanced view content goes here</div>;
  };
  
  // Render parsed JSON content
  const renderParsedJsonContent = () => {
    if (!selectedParsedJson) {
      return (
        <div className="json-viewer-container">
          <h2>JSON Viewer - Tab 4</h2>
          <div className="no-data-message">
            No data available for Tab 4. Please select a file and click "Process File".
          </div>
          <button className="load-sample-btn">Load Sample Data</button>
        </div>
      );
    }
    
    // You would implement JSON viewer here
    return (
      <div className="json-viewer-container">
        <h2>JSON Viewer - Tab 4</h2>
        <div className="json-content">Parsed JSON content for: {selectedParsedJson}</div>
      </div>
    );
  };
  
  // Render enhanced JSON content
  const renderEnhancedJsonContent = () => {
    if (!selectedEnhancedJson) {
      return (
        <div className="json-viewer-container">
          <h2>JSON Viewer - Tab 5</h2>
          <div className="no-data-message">
            No data available for Tab 5. Please select a file and click "Process File".
          </div>
          <button className="load-sample-btn">Load Sample Data</button>
        </div>
      );
    }
    
    // You would implement JSON viewer here
    return (
      <div className="json-viewer-container">
        <h2>JSON Viewer - Tab 5</h2>
        <div className="json-content">Enhanced JSON content for: {selectedEnhancedJson}</div>
      </div>
    );
  };

  return (
    <div className="pdf-viewer-container">
      {/* PDF file info */}
      {selectedPdf && (
        <div className="pdf-info">
          <h2>Selected PDF: {selectedPdf}</h2>
        </div>
      )}
      
      {/* Tabs */}
      <div className="tabs">
        <button 
          className={activeTab === 'basic' ? 'active' : ''} 
          onClick={() => setActiveTab('basic')}
        >
          Tab 1: Basic
        </button>
        <button 
          className={activeTab === 'modified' ? 'active' : ''} 
          onClick={() => setActiveTab('modified')}
        >
          Tab 2: Modified
        </button>
        <button 
          className={activeTab === 'enhanced' ? 'active' : ''} 
          onClick={() => setActiveTab('enhanced')}
        >
          Tab 3: Enhanced
        </button>
        <button 
          className={activeTab === 'parsed' ? 'active' : ''} 
          onClick={() => setActiveTab('parsed')}
        >
          Tab 4: Parsed JSONs
        </button>
        <button 
          className={activeTab === 'enhancedJson' ? 'active' : ''} 
          onClick={() => setActiveTab('enhancedJson')}
        >
          Tab 5: Enhanced JSONs
        </button>
      </div>
      
      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'basic' && renderPdfViewer()}
        {activeTab === 'modified' && renderModifiedContent()}
        {activeTab === 'enhanced' && renderEnhancedContent()}
        {activeTab === 'parsed' && renderParsedJsonContent()}
        {activeTab === 'enhancedJson' && renderEnhancedJsonContent()}
      </div>
      
      {/* JSON Selector */}
      {selectedPdf && (
        <JsonSelector
          selectedPdf={selectedPdf}
          folderPath={folderPath}
          onParsedJsonSelect={handleParsedJsonSelect}
          onEnhancedJsonSelect={handleEnhancedJsonSelect}
        />
      )}
    </div>
  );
};

export default PDFViewer; 