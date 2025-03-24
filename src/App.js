import React, { useState, useEffect } from 'react';
import './App.css';
import { JsonProcessor } from './utils/JsonProcessor';
import { SAMPLE_JSON } from './constants/sampleData';
import { FileUploader } from './components/FileUploader';
import { TabPanel } from './components/TabPanel';

function App() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [activeTab, setActiveTab] = useState('results');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [folders, setFolders] = useState(['Folder 1', 'Folder 2', 'Folder 3']);
  const [pdfFiles, setPdfFiles] = useState(['File 1.pdf', 'File 2.pdf', 'File 3.pdf']);
  const [activeFolder, setActiveFolder] = useState(null);
  const [activePdfFile, setActivePdfFile] = useState(null);
  const [selectedTab, setSelectedTab] = useState(2);

  useEffect(() => {
    console.log("App rendered");
    console.log("Current layout structure:", {
      sidebar: document.querySelector('.sidebar')?.getBoundingClientRect(),
      mainContent: document.querySelector('.main-content')?.getBoundingClientRect(),
      pageViewer: document.querySelector('.page-viewer')?.getBoundingClientRect(),
      tabsView: document.querySelector('.tabs-view')?.getBoundingClientRect(),
      resultsContainer: document.querySelector('.results-container')?.getBoundingClientRect()
    });
    
    // Check applied styles
    const sidebarEl = document.querySelector('.sidebar');
    const mainContentEl = document.querySelector('.main-content');
    const pageViewerEl = document.querySelector('.page-viewer');
    const tabsViewEl = document.querySelector('.tabs-view');
    const resultsContainerEl = document.querySelector('.results-container');
    
    if (sidebarEl) {
      console.log("Sidebar computed styles:", 
        window.getComputedStyle(sidebarEl).width,
        window.getComputedStyle(sidebarEl).backgroundColor);
    }
    
    if (mainContentEl) {
      console.log("Main content computed styles:", 
        window.getComputedStyle(mainContentEl).display,
        window.getComputedStyle(mainContentEl).flexDirection);
    }
    
    if (pageViewerEl) {
      console.log("Page viewer computed styles:", 
        window.getComputedStyle(pageViewerEl).flex,
        window.getComputedStyle(pageViewerEl).height);
    }
    
    if (tabsViewEl) {
      console.log("Tabs view computed styles:", 
        window.getComputedStyle(tabsViewEl).flex,
        window.getComputedStyle(tabsViewEl).height);
    }
    
    if (resultsContainerEl) {
      console.log("Results container computed styles:", 
        window.getComputedStyle(resultsContainerEl).width,
        window.getComputedStyle(resultsContainerEl).display);
    }
    
    console.log("Side-by-side layout enabled - debugging flex layout");
    
    // Debug header content
    document.title = "Document Review Application v1";
    console.log("Document title set to:", document.title);
    
    // Debug the tab selection
    console.log("Selected tab index:", selectedTab);
    console.log("Tab content element:", document.querySelector('.tab-content'));
    
    console.log("Initial tab content rendering for tab:", selectedTab + 1);
  }, [selectedTab]);
  
  // Log each time the component renders with current state
  console.log("Rendering with state:", { 
    folders, 
    pdfFiles, 
    activeFolder, 
    activePdfFile 
  });
  
  // Reference the functions to avoid ESLint warnings
  useEffect(() => {
    // This is a dummy effect to reference the functions and avoid warnings
    console.log("Functions available for folder/file management:", {
      addFolder, 
      addPdfFile
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Process the selected files
  const processFiles = async () => {
    if (files.length === 0) {
      // If no files selected, use sample data for testing
      const processor = new JsonProcessor();
      const processedData = processor.processArray(SAMPLE_JSON);
      setResults([{
        name: 'sample-data.json',
        data: processedData,
        rawData: SAMPLE_JSON
      }]);
      setActiveFile(0);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const processedFiles = [];
      
      for (const file of files) {
        const content = await readFileAsJson(file);
        const dataToProcess = Array.isArray(content) ? content : [content];
        
        const processor = new JsonProcessor();
        const processed = processor.processArray(dataToProcess);
        
        processedFiles.push({
          name: file.name,
          data: processed,
          rawData: content
        });
      }
      
      setResults(processedFiles);
      if (processedFiles.length > 0) {
        setActiveFile(0);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to read file as JSON
  const readFileAsJson = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          resolve(json);
        } catch (err) {
          reject(new Error(`Invalid JSON in file ${file.name}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error(`Error reading file ${file.name}`));
      };
      
      reader.readAsText(file);
    });
  };

  // Get active file data
  const getActiveFileData = () => {
    if (activeFile === null || results.length === 0) return null;
    return results[activeFile];
  };

  // Handle folder selection
  const handleFolderSelect = (index) => {
    setActiveFolder(index);
  };

  // Handle PDF file selection
  const handlePdfFileSelect = (index) => {
    setActivePdfFile(index);
  };

  // Add folder
  /* eslint-disable-next-line no-unused-vars */
  const addFolder = (folderName) => {
    setFolders(prevFolders => [...prevFolders, folderName]);
  };
  
  // Add PDF file
  /* eslint-disable-next-line no-unused-vars */
  const addPdfFile = (fileName) => {
    setPdfFiles(prevFiles => [...prevFiles, fileName]);
  };

  // Handle tab selection
  const handleTabSelect = (index) => {
    console.log("Tab selected:", index);
    setSelectedTab(index);
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
          <div className="sidebar h-100">
            <div className="mb-4">
              <h2>PDF Folders</h2>
              <ul className="list-unstyled">
                {folders.map((folder, index) => (
                  <li 
                    key={index} 
                    className={activeFolder === index ? 'active' : ''}
                    onClick={() => handleFolderSelect(index)}
                    style={{ color: '#00008B' }}
                  >
                    {folder}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h2>PDF Files</h2>
              <ul className="list-unstyled">
                {pdfFiles.map((file, index) => (
                  <li 
                    key={index} 
                    className={activePdfFile === index ? 'active' : ''}
                    onClick={() => handlePdfFileSelect(index)}
                    style={{ color: '#00008B' }}
                  >
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="col-md-10 col-lg-10 col-xl-11">
          <div className="row">
            <div className="col-lg-6 mb-3">
              <div className="viewer-container h-100">
                <div className="page-viewer mb-3">
                  <div 
                    style={{ 
                      border: '1px solid #ccc', 
                      padding: '10px', 
                      height: '100%',
                      margin: '0'
                    }}
                  >
                    <div 
                      style={{ 
                        border: '1px solid #ccc', 
                        padding: '10px'
                      }}
                    >
                      <h2 style={{ margin: '0', color: '#000' }}>Placeholder for Page Viewer</h2>
                      <p style={{ color: '#8B4513', marginTop: '5px', marginBottom: '0' }}>This is where the content will be displayed.</p>
                    </div>
                  </div>
                </div>
                
                <div className="tabs-view">
                  <ul 
                    style={{ 
                      listStyleType: 'disc', 
                      paddingLeft: '20px', 
                      marginBottom: '0'
                    }}
                  >
                    {['Tab 1', 'Tab 2', 'Tab 3', 'Tab 4', 'Tab 5'].map((tab, index) => (
                      <li 
                        key={index} 
                        onClick={() => handleTabSelect(index)}
                        style={{ 
                          color: '#00008B', 
                          fontWeight: selectedTab === index ? 'bold' : 'normal',
                          cursor: 'pointer'
                        }}
                      >
                        {tab}
                      </li>
                    ))}
                  </ul>
                  
                  <div 
                    style={{ 
                      border: '1px solid #ccc', 
                      padding: '10px', 
                      marginTop: '10px'
                    }}
                  >
                    <span style={{ color: '#000' }}>
                      Placeholder HTML Viewer for Tab {selectedTab + 1}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6 mb-3">
              <div className="results-container h-100">
                {results.length > 0 ? (
                  <TabPanel
                    results={results}
                    activeFile={activeFile}
                    activeTab={activeTab}
                    onFileSelect={setActiveFile}
                    onTabSelect={setActiveTab}
                    getActiveFileData={getActiveFileData}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <h3>No Results Available</h3>
                    <p>Process a file to see results here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;