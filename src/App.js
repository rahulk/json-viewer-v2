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
  
  // Sample data for different HTML views
  const htmlContents = [
    `<div>
      <h5>HTML Content for Tab 1</h5>
      <p>This is the HTML content specific to Tab 1.</p>
      <ul>
        <li>Tab 1 Item 1</li>
        <li>Tab 1 Item 2</li>
        <li>Tab 1 Item 3</li>
      </ul>
      <p>You can customize this content for each tab.</p>
    </div>`,
    `<div>
      <h5>HTML Content for Tab 2</h5>
      <p>This is the HTML content specific to Tab 2.</p>
      <table border="1" style="width:100%">
        <tr>
          <th>Header 1</th>
          <th>Header 2</th>
        </tr>
        <tr>
          <td>Tab 2 Row 1, Cell 1</td>
          <td>Tab 2 Row 1, Cell 2</td>
        </tr>
        <tr>
          <td>Tab 2 Row 2, Cell 1</td>
          <td>Tab 2 Row 2, Cell 2</td>
        </tr>
      </table>
    </div>`,
    `<div>
      <h5>HTML Content for Tab 3</h5>
      <p>This is the HTML content specific to Tab 3.</p>
      <div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
        <p>Tab 3 contains a styled div with custom content.</p>
        <code>const example = "This is a code sample in Tab 3";</code>
      </div>
      <p>Each tab can have completely different HTML structures.</p>
    </div>`
  ];

  // Use custom hooks for folder and JSON management
  const {
    folders,
    foldersLoading,
    foldersError,
    pdfFiles,
    activeFolder,
    activePdfFile,
    selectedPdfUrl,
    fetchFolders,
    handleFolderSelect,
    handlePdfFileSelect
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
              <div className="results-container h-100">
                <div className="d-flex justify-content-start mb-3">
                  <ul className="nav nav-tabs">
                    {['Tab 1', 'Tab 2', 'Tab 3', 'Tab 4', 'Tab 5'].map((tab, index) => (
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
                
                <TabContent
                  selectedTab={selectedTab}
                  htmlContents={htmlContents}
                  tab4State={tab4State}
                  tab5State={tab5State}
                  handleTab4StateChange={handleTab4StateChange}
                  handleTab5StateChange={handleTab5StateChange}
                  processFiles={processFiles}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;