import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';

export const useFolderManagement = () => {
  const [folders, setFolders] = useState([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [foldersError, setFoldersError] = useState(null);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [activePdfFile, setActivePdfFile] = useState(null);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);

  const fetchFolders = useCallback(async () => {
    setFoldersLoading(true);
    setFoldersError(null);
    
    try {
      const folderList = await apiService.getFolders('/documents/output');
      setFolders(folderList);
      
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
  }, [activeFolder]);

  const handleFolderSelect = async (index) => {
    setActiveFolder(index);
    setActivePdfFile(null);
    
    const selectedFolder = folders[index];
    
    try {
      const encodedFolder = encodeURIComponent(selectedFolder);
      const folderPath = `/documents/output/${encodedFolder}/${encodedFolder}`;
      
      const filesList = await apiService.getFiles(folderPath);
      const pdfFilesList = filesList.filter(file => 
        file.toLowerCase().endsWith('.pdf')
      );
      
      setPdfFiles(pdfFilesList);
      
      if (pdfFilesList.length > 0) {
        setActivePdfFile(0);
      }
    } catch (err) {
      console.error(`Error fetching files for folder ${selectedFolder}:`, err);
      setPdfFiles([]);
    }
  };

  const handlePdfFileSelect = (index) => {
    setActivePdfFile(index);
    
    if (index !== null && activeFolder !== null) {
      const selectedFolder = folders[activeFolder];
      const selectedFile = pdfFiles[index];
      
      const encodedFolder = encodeURIComponent(selectedFolder);
      const encodedFile = encodeURIComponent(selectedFile);
      const pdfUrl = `http://localhost:3001/api/pdf?path=/documents/output/${encodedFolder}/${encodedFolder}/${encodedFile}`;
      
      setSelectedPdfUrl(pdfUrl);
    } else {
      setSelectedPdfUrl(null);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  return {
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
  };
}; 