import React, { useState, useEffect } from 'react';
import PDFViewer from './PDFViewer';
import './PdfViewer.css';

const FileBrowser = () => {
  const [currentFolder, setCurrentFolder] = useState('documents/output');
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Load folders and files when component mounts or currentFolder changes
  useEffect(() => {
    fetchFolders();
    fetchFiles();
  }, [currentFolder]);
  
  // Fetch folders from the API
  const fetchFolders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/folders?path=${encodeURIComponent(currentFolder)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch folders');
      }
      
      const data = await response.json();
      setFolders(data.folders || []);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError('Failed to load folders. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch files from the API
  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(currentFolder)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      
      const data = await response.json();
      
      // Filter only PDF files
      const pdfFiles = (data.files || []).filter(file => file.toLowerCase().endsWith('.pdf'));
      setFiles(pdfFiles);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle folder navigation
  const navigateToFolder = (folder) => {
    const newPath = `${currentFolder}/${folder}`;
    setCurrentFolder(newPath);
    setSelectedFile(null); // Reset selected file on folder navigation
  };
  
  // Handle file selection
  const handleFileSelect = (file) => {
    setSelectedFile(file);
  };
  
  // Handle navigation to parent folder
  const navigateToParent = () => {
    // Split the path and remove the last segment
    const pathSegments = currentFolder.split('/');
    if (pathSegments.length > 1) {
      pathSegments.pop();
      const parentPath = pathSegments.join('/');
      setCurrentFolder(parentPath);
      setSelectedFile(null); // Reset selected file on folder navigation
    }
  };
  
  return (
    <div className="file-browser-container">
      <div className="file-browser">
        <div className="file-browser-header">
          <h2>File Browser</h2>
          <div className="current-path">
            <span>Current path: {currentFolder}</span>
            {currentFolder !== 'documents/output' && (
              <button onClick={navigateToParent} className="back-button">
                ↑ Up
              </button>
            )}
          </div>
        </div>
        
        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error">{error}</div>}
        
        <div className="folders-section">
          <h3>Folders</h3>
          {folders.length === 0 ? (
            <p className="no-items">No folders found</p>
          ) : (
            <ul className="folder-list">
              {folders.map((folder, index) => (
                <li key={index} onClick={() => navigateToFolder(folder)} className="folder-item">
                  📁 {folder}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="files-section">
          <h3>PDF Files</h3>
          {files.length === 0 ? (
            <p className="no-items">No PDF files found</p>
          ) : (
            <ul className="file-list">
              {files.map((file, index) => (
                <li 
                  key={index} 
                  onClick={() => handleFileSelect(file)} 
                  className={`file-item ${selectedFile === file ? 'selected' : ''}`}
                >
                  📄 {file}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* PDF Viewer integration */}
      {selectedFile && (
        <PDFViewer
          pdfPath={currentFolder}
          pdfFilename={selectedFile}
        />
      )}
    </div>
  );
};

export default FileBrowser; 