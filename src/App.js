import React, { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';
// import { FileUploader } from './components/FileUploader'; // Commented out since not used
import { PdfViewer } from './components/PdfViewer';
import { Sidebar } from './components/Sidebar';
import { TabContent } from './components/TabContent';
import { useFolderManagement } from './hooks/useFolderManagement';
import { useJsonProcessing } from './hooks/useJsonProcessing';
import { Nav } from 'react-bootstrap';

function App() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [enhancedHtmlContent, setEnhancedHtmlContent] = useState('');
  const [modifiedHtmlContent, setModifiedHtmlContent] = useState('');
  
  // Add these two state variables
  const [selectedParsedFile, setSelectedParsedFile] = useState('');
  const [selectedEnhancedFile, setSelectedEnhancedFile] = useState('');
  
  // Create the ref at component top level - NOT inside useEffect
  const prevPdfFileRef = useRef(null);
  
  // Use custom hooks for folder and JSON management
  const {
    folders,
    pdfFiles,
    activeFolder,
    activePdfFile,
    parsedJsons,
    enhancedJsons,
    basicHtmlContent,
    handleFolderSelect,
    handlePdfFileSelect,
    foldersLoading,
    foldersError,
    selectedPdfUrl,
    fetchFolders
  } = useFolderManagement();

  const {
    // setFiles,        // Commented out since not used
    // isLoading,       // Commented out since not used
    // error,           // Commented out since not used
    tab4State,
    tab5State,
    processFiles,
    handleTab4StateChange,
    handleTab5StateChange,
    resetTabStates  // Add this
  } = useJsonProcessing();

  // Update the loadHtmlContent function to better handle null checks
  const loadHtmlContent = useCallback(async (type) => {
    // Make sure we have everything we need
    if (activeFolder === null || activePdfFile === null) {
      console.log(`Cannot load ${type} HTML: No active folder or PDF file selected`, {
        activeFolder, 
        activePdfFile
      });
      return;
    }
    
    const folderName = folders[activeFolder];
    const pdfFileName = pdfFiles[activePdfFile];
    
    if (!folderName || !pdfFileName) {
      console.log(`Cannot load ${type} HTML: Invalid folder or file name`, { 
        folderIndex: activeFolder, 
        fileIndex: activePdfFile,
        folderName, 
        pdfFileName 
      });
      return;
    }
    
    try {
      const baseFileName = pdfFileName.replace('.pdf', '');
      const htmlType = type === 'enhanced' ? 'enhanced_html' : 'modified_html';
      const suffix = type === 'enhanced' ? '_enhanced.html' : '_modified.html';
      
      console.log(`🔍 Loading ${type} HTML for:`, {
        baseFileName,
        folderName,
        htmlType,
        suffix
      });
      
      // Build the URL
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/html?folder=${encodeURIComponent(folderName)}&subFolder=${encodeURIComponent(htmlType)}&file=${encodeURIComponent(baseFileName + suffix)}`;
      
      console.log(`📡 Requesting URL:`, url);
      
      const response = await fetch(url);
      
      if (response.ok) {
        const htmlContent = await response.text();
        console.log(`✅ Successfully loaded ${type} HTML, length:`, htmlContent.length);
        
        if (type === 'enhanced') {
          setEnhancedHtmlContent(htmlContent);
        } else {
          setModifiedHtmlContent(htmlContent);
        }
      } else {
        console.error(`❌ Failed to load ${type} HTML:`, response.status, response.statusText);
        
        if (type === 'enhanced') {
          setEnhancedHtmlContent(`<div class="alert alert-danger">Failed to load enhanced HTML content (${response.status} ${response.statusText})</div>`);
        } else {
          setModifiedHtmlContent(`<div class="alert alert-danger">Failed to load modified HTML content (${response.status} ${response.statusText})</div>`);
        }
      }
    } catch (error) {
      console.error(`❌ Error loading ${type} HTML:`, error);
      
      if (type === 'enhanced') {
        setEnhancedHtmlContent(`<div class="alert alert-danger">Error: ${error.message}</div>`);
      } else {
        setModifiedHtmlContent(`<div class="alert alert-danger">Error: ${error.message}</div>`);
      }
    }
  }, [activeFolder, activePdfFile, folders, pdfFiles]);

  // Update the tab change handler
  const handleTabSelect = useCallback(async (index) => {
    console.log(`🔄 Changing to tab ${index}`);
    setSelectedTab(index);
    
    // Only load HTML content if we have an active folder and PDF file
    if (activeFolder !== null && activePdfFile !== null) {
      const folderName = folders[activeFolder];
      const pdfFileName = pdfFiles[activePdfFile];
      
      console.log(`📂 Current selection:`, {
        tab: index,
        folder: folderName,
        pdf: pdfFileName
      });
      
      // Load appropriate content based on tab index
      switch (index) {
        case 1: // Enhanced HTML (Tab 2)
          loadHtmlContent('enhanced');
          break;
        case 2: // Modified HTML (Tab 3)
          loadHtmlContent('modified');
          break;
        default:
          break;
      }
    } else {
      console.log(`❌ Cannot load HTML for tab ${index}: No active folder or PDF file selected`);
    }
  }, [activeFolder, activePdfFile, loadHtmlContent, folders, pdfFiles]);

  // Update the useEffect to check for activeFolder and activePdfFile before attempting to load content
  useEffect(() => {
    // Only try to load HTML content if both folder and PDF are selected
    if (activeFolder !== null && activePdfFile !== null) {
      console.log("PDF selection changed, loading HTML content for current tab", { 
        selectedTab,
        folderName: folders[activeFolder],
        pdfFileName: pdfFiles[activePdfFile]
      });
      
      if (selectedTab === 1) {
        loadHtmlContent('enhanced');
      } else if (selectedTab === 2) {
        loadHtmlContent('modified');
      }
    } else {
      console.log("Cannot load HTML content: No folder or PDF selected", {
        activeFolder,
        activePdfFile
      });
      
      // Reset HTML content when no PDF is selected
      setEnhancedHtmlContent('');
      setModifiedHtmlContent('');
    }
  }, [activePdfFile, activeFolder, selectedTab, loadHtmlContent, folders, pdfFiles]);

  // Add this useEffect after your other useEffects
  useEffect(() => {
    // If the PDF file selection has changed and it's not the initial selection
    if (activePdfFile !== null && prevPdfFileRef.current !== null && activePdfFile !== prevPdfFileRef.current) {
      console.log('PDF file changed, resetting tab data states');
      resetTabStates();
      
      // Also reset the selected parsed/enhanced files in TabContent
      setSelectedParsedFile('');
      setSelectedEnhancedFile('');
    }
    
    // Update the ref with current value for next comparison
    prevPdfFileRef.current = activePdfFile;
  }, [activePdfFile, resetTabStates]);

  return (
    <div className="App container-fluid px-2 px-sm-3 px-md-4" style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header className="App-header py-2">
        <h1>Document Review Application v1</h1>
        <p className="mb-2">Process multiple document files with different structures</p>
      </header>
      
      <div className="row flex-grow-1" style={{ minHeight: 0, overflow: 'hidden' }}>
        <div className="col-md-2 col-lg-2 col-xl-1" style={{ height: '100%', overflowY: 'auto', paddingBottom: '10px' }}>
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
        
        <div className="col-md-10 col-lg-10 col-xl-11" style={{ height: '100%', overflow: 'hidden' }}>
          <div className="row h-100 g-3">
            <div className="col-lg-6" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="viewer-container flex-grow-1" style={{ minHeight: 0, overflow: 'hidden' }}>
                <div className="page-viewer h-100">
                  <div 
                    style={{ 
                      border: '1px solid #ccc', 
                      height: '100%',
                      overflow: 'hidden'
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
            
            <div className="col-lg-6" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div 
                className="results-container flex-grow-1"
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  minHeight: 0,
                  overflow: 'hidden'
                }}
              >
                <div className="nav-tabs-wrapper">
                  <Nav variant="tabs" className="nav-tabs">
                    <Nav.Item>
                      <Nav.Link
                        className={`nav-link ${selectedTab === 0 ? 'active' : ''}`}
                        onClick={() => handleTabSelect(0)}
                      >
                        Basic
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link
                        className={`nav-link ${selectedTab === 1 ? 'active' : ''}`}
                        onClick={() => handleTabSelect(1)}
                      >
                        Enhanced
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link
                        className={`nav-link ${selectedTab === 2 ? 'active' : ''}`}
                        onClick={() => handleTabSelect(2)}
                      >
                        Modified
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link
                        className={`nav-link ${selectedTab === 3 ? 'active' : ''}`}
                        onClick={() => handleTabSelect(3)}
                      >
                        Parsed JSONs
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link
                        className={`nav-link ${selectedTab === 4 ? 'active' : ''}`}
                        onClick={() => handleTabSelect(4)}
                      >
                        Enhanced JSONs
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </div>
                
                <div style={{ 
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <TabContent 
                    selectedTab={selectedTab}
                    htmlContents={[
                      basicHtmlContent,
                      activeFolder !== null && activePdfFile !== null ? enhancedHtmlContent : '',
                      activeFolder !== null && activePdfFile !== null ? modifiedHtmlContent : ''
                    ]}
                    tab4State={tab4State}
                    tab5State={tab5State}
                    handleTab4StateChange={handleTab4StateChange}
                    handleTab5StateChange={handleTab5StateChange}
                    processFiles={processFiles}
                    folderPath={folders[activeFolder]}
                    pdfFilename={pdfFiles[activePdfFile]}
                    parsedJsons={parsedJsons}
                    enhancedJsons={enhancedJsons}
                    selectedParsedFile={selectedParsedFile}
                    setSelectedParsedFile={setSelectedParsedFile}
                    selectedEnhancedFile={selectedEnhancedFile}
                    setSelectedEnhancedFile={setSelectedEnhancedFile}
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