import React, { useState, useEffect } from 'react';
import './App.css';
import { JsonProcessor } from './utils/JsonProcessor';
import { SAMPLE_JSON } from './constants/sampleData';
import { FileUploader } from './components/FileUploader';
import { FlatDataTable } from './components/FlatDataTable';
import { apiService } from './services/apiService';
import { PdfViewer } from './components/PdfViewer';

function App() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  /* eslint-disable-next-line no-unused-vars */
  const [activeFile, setActiveFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [folders, setFolders] = useState([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [foldersError, setFoldersError] = useState(null);
  const [pdfFiles, setPdfFiles] = useState(['File 1.pdf', 'File 2.pdf', 'File 3.pdf']);
  const [activeFolder, setActiveFolder] = useState(null);
  const [activePdfFile, setActivePdfFile] = useState(null);
  const [selectedTab, setSelectedTab] = useState(3);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  
  // Add state for each tab
  const [tab4State, setTab4State] = useState({
    data: [], // Initialize with empty array
    columnVisibility: {},
    filters: {},
    wrapText: false,
    filterColoredText: false
  });

  const [tab5State, setTab5State] = useState({
    data: [], // Initialize with empty array
    columnVisibility: {},
    filters: {},
    wrapText: false,
    filterColoredText: false
  });

  // Fetch folders from the /documents/output directory
  const fetchFolders = async () => {
    setFoldersLoading(true);
    setFoldersError(null);
    
    try {
      const folderList = await apiService.getFolders('/documents/output');
      setFolders(folderList);
      console.log("Folders fetched successfully:", folderList);
      
      // Set the first folder as active if none is selected and folders exist
      if (activeFolder === null && folderList.length > 0) {
        setActiveFolder(0);
      }
    } catch (err) {
      console.error("Error fetching folders:", err);
      setFoldersError("Failed to load folders. Please try again.");
      setFolders([]);
    } finally {
      setFoldersLoading(false);
    }
  };
  
  // Initial folder fetch on component mount
  useEffect(() => {
    fetchFolders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Sample data for different HTML views and JSON data
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
  
  // Sample JSON data for tabs 4 and 5
  const [jsonData4, setJsonData4] = useState([]);
  const [jsonData5, setJsonData5] = useState([]);
  
  // Process sample data for each JSON tab
  useEffect(() => {
    // Create different sample data for tabs 4 and 5
    const processor = new JsonProcessor();
    
    // Data for Tab 4
    const sampleData4 = [
      { 
        id: "ID001", 
        itemName: "Tab 4 Item 1", 
        category: "Category A", 
        price: 125.50,
        inStock: true,
        lastUpdated: "2023-05-15" 
      },
      { 
        id: "ID002", 
        itemName: "Tab 4 Item 2", 
        category: "Category B", 
        price: 225.75,
        inStock: false,
        lastUpdated: "2023-06-20" 
      },
      { 
        id: "ID003", 
        itemName: "Tab 4 Item 3", 
        category: "Category A", 
        price: 175.25,
        inStock: true,
        lastUpdated: "2023-07-10" 
      }
    ];
    
    // Data for Tab 5
    const sampleData5 = [
      { productId: "P001", productName: "Tab 5 Product 1", price: 29.99, inStock: true },
      { productId: "P002", productName: "Tab 5 Product 2", price: 49.99, inStock: false },
      { productId: "P003", productName: "Tab 5 Product 3", price: 19.99, inStock: true }
    ];
    
    // Process the data
    const processedData4 = processor.processArray(sampleData4);
    const processedData5 = processor.processArray(sampleData5);
    
    setJsonData4(processedData4.results);
    setJsonData5(processedData5.results);
    
    // Load sample data if needed for initial render
    if (selectedTab >= 3 && results.length === 0) {
      processFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    console.log("Processing files:", files);
    
    if (files.length === 0) {
      // If no files selected, use sample data for testing
      console.log("No files selected, using sample data");
      const processor = new JsonProcessor();
      const processedData = processor.processArray(SAMPLE_JSON);
      
      setTab4State(prevState => ({
        ...prevState,
        data: processedData.results || [] // Ensure we have an array
      }));
      
      setTab5State(prevState => ({
        ...prevState,
        data: processedData.results || [] // Ensure we have an array
      }));

      setResults([{
        name: 'sample-data.json',
        data: processedData,
        rawData: SAMPLE_JSON
      }]);
      setActiveFile(0);
      setSelectedTab(3);
      return;
    }

    setIsLoading(true);
    setError(null);
    console.log(`Processing ${files.length} selected files...`);
    
    try {
      const processedFiles = [];
      const processor = new JsonProcessor();
      
      for (const file of files) {
        console.log(`Reading file: ${file.name}`);
        const content = await readFileAsJson(file);
        console.log("File content:", content); // Debug log
        
        // Ensure content is an array
        const dataToProcess = Array.isArray(content) ? content : [content];
        
        const processed = processor.processArray(dataToProcess);
        console.log(`Processed data from ${file.name}:`, processed);
        
        processedFiles.push({
          name: file.name,
          data: processed,
          rawData: content
        });

        // Update tab states with the processed data
        // Make sure we're using the correct data structure
        const tableData = processed.results || processed || dataToProcess;
        console.log("Data being set to FlatDataTable:", tableData); // Debug log

        setTab4State(prevState => ({
          ...prevState,
          data: tableData
        }));
        
        setTab5State(prevState => ({
          ...prevState,
          data: tableData
        }));
      }
      
      console.log("All files processed:", processedFiles);
      setResults(processedFiles);
      if (processedFiles.length > 0) {
        setActiveFile(0);
        setSelectedTab(3); // Switch to Tab 4 to show the processed data
      }
      
    } catch (err) {
      console.error("Error processing files:", err);
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

  // Handle folder selection
  const handleFolderSelect = async (index) => {
    setActiveFolder(index);
    setActivePdfFile(null); // Reset active PDF file selection
    
    // Get the selected folder name
    const selectedFolder = folders[index];
    
    try {
      // Preserve exact folder name with proper encoding
      const encodedFolder = encodeURIComponent(selectedFolder);
      const folderPath = `/documents/output/${encodedFolder}/${encodedFolder}`;
      console.log(`Original folder name: "${selectedFolder}" (${selectedFolder.length} chars)`);
      console.log(`Fetching files from path: ${folderPath}`);
      
      const filesList = await apiService.getFiles(folderPath);
      
      // Filter to only include PDF files
      const pdfFilesList = filesList.filter(file => 
        file.toLowerCase().endsWith('.pdf')
      );
      
      console.log(`Found ${pdfFilesList.length} PDF files in folder: ${selectedFolder}`);
      setPdfFiles(pdfFilesList);
      
      // If files exist, automatically select the first one
      if (pdfFilesList.length > 0) {
        setActivePdfFile(0);
      }
    } catch (err) {
      console.error(`Error fetching files for folder ${selectedFolder}:`, err);
      setPdfFiles([]);
    }
  };

  // Handle PDF file selection
  const handlePdfFileSelect = (index) => {
    setActivePdfFile(index);
    
    if (index !== null && activeFolder !== null) {
      const selectedFolder = folders[activeFolder];
      const selectedFile = pdfFiles[index];
      
      // Build the path with proper structure and preserve exact spacing
      const encodedFolder = encodeURIComponent(selectedFolder);
      const encodedFile = encodeURIComponent(selectedFile);
      // Use the correct port (3001) for the API server
      const pdfUrl = `http://localhost:3001/api/pdf?path=/documents/output/${encodedFolder}/${encodedFolder}/${encodedFile}`;
      
      console.log('Original folder name:', selectedFolder);
      console.log('Folder name length:', selectedFolder.length);
      console.log('Encoded folder name:', encodedFolder);
      console.log('Setting PDF URL:', pdfUrl);
      
      // Show file path information in an alert for debugging
      const serverPath = `SERVER_DIR/documents/output/${selectedFolder}/${selectedFolder}/${selectedFile}`;
      alert(`PDF Path Information:\n\nClient request: ${pdfUrl}\n\nServer file path: ${serverPath}\n\nFolder name length: ${selectedFolder.length} chars\nCheck server logs for the actual resolved file path.`);
      
      setSelectedPdfUrl(pdfUrl);
      
      // Add visual feedback that PDF is loading
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 2000); // Reset after 2 seconds
    } else {
      setSelectedPdfUrl(null);
    }
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
    console.log(`Tab ${index + 1} selected - ${index <= 2 ? 'HTML Viewer' : 'JSON/FlatDataTable Viewer'}`);
    setSelectedTab(index);
    
    // If selecting a JSON viewer tab but no data is loaded, auto-load sample data
    if (index >= 3 && results.length === 0) {
      console.log('Auto-loading sample data for JSON viewer');
      processFiles();
    }
  };

  // Callback to update state for Tab 4
  const handleTab4StateChange = (newState) => {
    setTab4State(prevState => ({
      ...prevState,
      ...newState
    }));
  };

  // Callback to update state for Tab 5
  const handleTab5StateChange = (newState) => {
    setTab5State(prevState => ({
      ...prevState,
      ...newState
    }));
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
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h2>PDF Folders</h2>
                <button 
                  className="btn btn-sm btn-outline-secondary" 
                  onClick={fetchFolders}
                  disabled={foldersLoading}
                  title="Refresh folders"
                >
                  {foldersLoading ? "..." : "↻"}
                </button>
              </div>
              
              {foldersLoading ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading folders...</span>
                  </div>
                  <p className="mt-2 small text-muted">Loading folders...</p>
                </div>
              ) : foldersError ? (
                <div className="alert alert-danger py-2 small">
                  {foldersError}
                  <button 
                    className="btn btn-sm btn-outline-danger ms-2"
                    onClick={fetchFolders}
                  >
                    Retry
                  </button>
                </div>
              ) : folders.length === 0 ? (
                <p className="text-muted small">No folders found in /documents/output</p>
              ) : (
                <ul className="list-unstyled">
                  {folders.map((folder, index) => (
                    <li 
                      key={index} 
                      className={`folder-item ${activeFolder === index ? 'active' : ''}`}
                      onClick={() => handleFolderSelect(index)}
                      style={{ 
                        color: '#00008B',
                        padding: '6px 8px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        marginBottom: '4px',
                        backgroundColor: activeFolder === index ? '#e9ecef' : 'transparent'
                      }}
                    >
                      <i className="bi bi-folder-fill me-2" style={{ color: '#FFD700' }}></i>
                      {folder}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div>
              <h2>PDF Files</h2>
              <ul className="list-unstyled">
                {pdfFiles.map((file, index) => (
                  <li 
                    key={index} 
                    className={`file-item ${activePdfFile === index ? 'active' : ''}`}
                    onClick={() => handlePdfFileSelect(index)}
                    style={{ 
                      color: '#00008B',
                      padding: '6px 8px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      marginBottom: '4px',
                      backgroundColor: activePdfFile === index ? '#e9ecef' : 'transparent'
                    }}
                  >
                    <i className="bi bi-file-pdf-fill me-2" style={{ color: '#FF0000' }}></i>
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
                
                {/* Conditional rendering based on selected tab */}
                {selectedTab === 0 && (
                  <div className="html-viewer" style={{ border: '1px solid #ccc', padding: '10px', height: 'calc(100% - 60px)', overflow: 'auto' }}>
                    <h4>HTML Viewer - Tab 1</h4>
                    <div 
                      style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                      dangerouslySetInnerHTML={{ __html: htmlContents[0] }}
                    ></div>
                  </div>
                )}
                
                {selectedTab === 1 && (
                  <div className="html-viewer" style={{ border: '1px solid #ccc', padding: '10px', height: 'calc(100% - 60px)', overflow: 'auto' }}>
                    <h4>HTML Viewer - Tab 2</h4>
                    <div 
                      style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                      dangerouslySetInnerHTML={{ __html: htmlContents[1] }}
                    ></div>
                  </div>
                )}
                
                {selectedTab === 2 && (
                  <div className="html-viewer" style={{ border: '1px solid #ccc', padding: '10px', height: 'calc(100% - 60px)', overflow: 'auto' }}>
                    <h4>HTML Viewer - Tab 3</h4>
                    <div 
                      style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                      dangerouslySetInnerHTML={{ __html: htmlContents[2] }}
                    ></div>
                  </div>
                )}
                
                {/* Render JSON Viewer for Tab 4 */}
                {selectedTab === 3 && (
                  <div className="json-viewer" style={{ border: '1px solid #ccc', padding: '10px', height: 'calc(100% - 60px)', overflow: 'auto' }}>
                    <h4>JSON Viewer - Tab 4</h4>
                    {tab4State.data && tab4State.data.length > 0 ? (
                      <div className="table-view">
                        <FlatDataTable 
                          data={tab4State.data}
                          sectionCode="TAB4"
                          showColumnSelection={true}
                          allowTextWrapping={true}
                          showColorHighlighting={true}
                          initialColumnVisibility={tab4State.columnVisibility}
                          onStateChange={handleTab4StateChange}
                          title="Flat Data View (Tab 4)"
                        />
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <p>No data available. Please select a file and click "Process Files".</p>
                        <button 
                          className="btn btn-primary"
                          onClick={processFiles}
                        >
                          Load Sample Data
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Render JSON Viewer for Tab 5 */}
                {selectedTab === 4 && (
                  <div className="json-viewer" style={{ border: '1px solid #ccc', padding: '10px', height: 'calc(100% - 60px)', overflow: 'auto' }}>
                    <h4>JSON Viewer - Tab 5</h4>
                    {tab5State.data && tab5State.data.length > 0 ? (
                      <div className="table-view">
                        <FlatDataTable 
                          data={tab5State.data}
                          sectionCode="TAB5"
                          showColumnSelection={true}
                          allowTextWrapping={true}
                          showColorHighlighting={true}
                          initialColumnVisibility={tab5State.columnVisibility}
                          onStateChange={handleTab5StateChange}
                          title="Flat Data View (Tab 5)"
                        />
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <p>No data available. Please select a file and click "Process Files".</p>
                        <button 
                          className="btn btn-primary"
                          onClick={processFiles}
                        >
                          Load Sample Data
                        </button>
                      </div>
                    )}
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