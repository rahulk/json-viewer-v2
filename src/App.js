import React, { useState } from 'react';
import './App.css';
import { FileUploader } from './components/FileUploader';
import { PdfViewer } from './components/PdfViewer';
import { Sidebar } from './components/Sidebar';
import { TabContent } from './components/TabContent';
import { useFolderManagement } from './hooks/useFolderManagement';
import { useJsonProcessing } from './hooks/useJsonProcessing';

function App() {
  const [selectedTab, setSelectedTab] = useState(3);
  
  // Use custom hooks for folder and JSON management
  const {
    folders,
    pdfFiles,
    activeFolder,
    activePdfFile,
    parsedJsons,
    enhancedJsons,
    basicHtmlContent, // This contains the HTML content for Tab 1
    handleFolderSelect,
    handlePdfFileSelect,
    foldersLoading,
    foldersError,
    selectedPdfUrl,
    fetchFolders
  } = useFolderManagement();

  const {
    setFiles,
    isLoading,
    error,
    tab4State,
    tab5State,
    processFiles,
    handleTab4StateChange,
    handleTab5StateChange
  } = useJsonProcessing();

  // Handle tab selection
  const handleTabSelect = (index) => {
    setSelectedTab(index);
    
    // If selecting a JSON viewer tab (tab 4 or 5) but no data is loaded, auto-load sample data
    if ((index === 3 && (!tab4State.data || tab4State.data.length === 0)) || 
        (index === 4 && (!tab5State.data || tab5State.data.length === 0))) {
      processFiles();
    }
  };

  return (
    <div className="App container-fluid px-2 px-sm-3 px-md-4">
      <header className="App-header mb-3">
        <h1>Document Review Application v1</h1>
        <p>Process multiple document files with different structures</p>
      </header>
      
      <div className="mb-3">
        <FileUploader
          onFileChange={setFiles}
          onProcess={processFiles}
          isLoading={isLoading}
          error={error}
        />
      </div>
      
      <div className="row">
        <div className="col-md-2 col-lg-2 col-xl-1 mb-3">
          <Sidebar
            folders={folders}
            foldersLoading={foldersLoading}
            foldersError={foldersError}
            pdfFiles={pdfFiles}
            activeFolder={activeFolder}
            activePdfFile={activePdfFile}
            fetchFolders={fetchFolders}
            handleFolderSelect={handleFolderSelect}
            handlePdfFileSelect={handlePdfFileSelect}
          />
        </div>
        
        <div className="col-md-10 col-lg-10 col-xl-11">
          <div className="row">
            <div className="col-lg-6 mb-3">
              <div className="viewer-container h-100">
                <div className="page-viewer">
                  <div 
                    style={{ 
                      border: '1px solid #ccc', 
                      padding: '10px', 
                      height: '100%',
                      margin: '0'
                    }}
                  >
                    <PdfViewer 
                      pdfUrl={selectedPdfUrl} 
                      fileName={activePdfFile !== null ? pdfFiles[activePdfFile] : null} 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6 mb-3">
              <div className="results-container" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div className="d-flex justify-content-start mb-3">
                  <ul className="nav nav-tabs">
                    {['Tab 1: Basic', 'Tab 2: Modified', 'Tab 3: Enhanced', 'Tab 4: Parsed JSONs', 'Tab 5: Enhanced JSONs'].map((tab, index) => (
                      <li className="nav-item" key={index}>
                        <button 
                          className={`nav-link ${selectedTab === index ? 'active' : ''}`}
                          onClick={() => handleTabSelect(index)}
                        >
                          {tab}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div style={{ flex: 1, minHeight: 0 }}> {/* This ensures proper scrolling */}
                  <TabContent 
                    selectedTab={selectedTab}
                    htmlContents={[basicHtmlContent]}
                    tab4State={tab4State}
                    tab5State={tab5State}
                    handleTab4StateChange={handleTab4StateChange}
                    handleTab5StateChange={handleTab5StateChange}
                    processFiles={processFiles}
                    folderPath={folders[activeFolder]}
                    pdfFilename={pdfFiles[activePdfFile]}
                    parsedJsons={parsedJsons}
                    enhancedJsons={enhancedJsons}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;