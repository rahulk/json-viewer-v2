import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import config from '../config';

export const useFolderManagement = () => {
  const [folders, setFolders] = useState([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [foldersError, setFoldersError] = useState(null);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [activeFolder, setActiveFolder] = useState(null);
  const [activePdfFile, setActivePdfFile] = useState(null);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [parsedJsons, setParsedJsons] = useState([]);
  const [enhancedJsons, setEnhancedJsons] = useState([]);
  const [basicHtmlContent, setBasicHtmlContent] = useState('');

  // Function to update PDF URL
  const updatePdfUrl = (folderPath, pdfFilename) => {
    if (folderPath && pdfFilename) {
      const encodedPath = encodeURIComponent(`${folderPath}/${pdfFilename}`);
      setSelectedPdfUrl(`${config.API.BASE_URL}${config.API.ENDPOINTS.PDF}?path=${encodedPath}`);
    } else {
      setSelectedPdfUrl(null);
    }
  };

  const fetchFolders = useCallback(async () => {
    setFoldersLoading(true);
    setFoldersError(null);
    
    try {
      const folderList = await apiService.getFolders(config.PATHS.DOCUMENTS_OUTPUT);
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
      const folderPath = `${config.PATHS.DOCUMENTS_OUTPUT}/${encodedFolder}/${encodedFolder}`;
      
      const filesList = await apiService.getFiles(folderPath);
      const pdfFilesList = filesList.filter(file => 
        file.toLowerCase().endsWith(config.PATHS.FILE_EXTENSIONS.PDF)
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

  const handlePdfFileSelect = async (index) => {
    setActivePdfFile(index);
    
    if (index !== null && activeFolder !== null) {
      const folderPath = folders[activeFolder];
      const pdfFilename = pdfFiles[index];
      
      console.log('Loading content for:', {
        folderPath,
        pdfFilename
      });

      try {
        // Fetch basic HTML content
        const htmlResponse = await fetch(
          `${config.API.BASE_URL}${config.API.ENDPOINTS.BASIC_HTML}?folderPath=${encodeURIComponent(folderPath)}&filename=${encodeURIComponent(pdfFilename)}`
        );
        
        if (htmlResponse.ok) {
          const htmlData = await htmlResponse.json();
          setBasicHtmlContent(htmlData.content);
        } else {
          console.error('Failed to load basic HTML');
          setBasicHtmlContent('');
        }

        // Fetch parsed JSONs
        const parsedResponse = await fetch(
          `${config.API.BASE_URL}${config.API.ENDPOINTS.PARSED_JSONS}?folderPath=${encodeURIComponent(folderPath)}&pdfFilename=${encodeURIComponent(pdfFilename)}`
        );
        
        if (!parsedResponse.ok) {
          const errorData = await parsedResponse.json();
          console.error('Parsed JSONs error:', errorData);
          setParsedJsons([]);
        } else {
          const parsedData = await parsedResponse.json();
          console.log('Parsed JSONs response:', parsedData);
          setParsedJsons(parsedData.jsonFiles || []);
        }

        // Fetch enhanced JSONs
        const enhancedResponse = await fetch(
          `${config.API.BASE_URL}${config.API.ENDPOINTS.ENHANCED_JSONS}?folderPath=${encodeURIComponent(folderPath)}&pdfFilename=${encodeURIComponent(pdfFilename)}`
        );
        
        if (!enhancedResponse.ok) {
          const errorData = await enhancedResponse.json();
          console.error('Enhanced JSONs error:', errorData);
          setEnhancedJsons([]);
        } else {
          const enhancedData = await enhancedResponse.json();
          console.log('Enhanced JSONs response:', enhancedData);
          setEnhancedJsons(enhancedData.jsonFiles || []);
        }

      } catch (error) {
        console.error('Error loading content:', error);
        setBasicHtmlContent('');
        setParsedJsons([]);
        setEnhancedJsons([]);
      }

      // Update the PDF URL
      updatePdfUrl(folderPath, pdfFilename);
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
    parsedJsons,
    enhancedJsons,
    basicHtmlContent,
    fetchFolders,
    handleFolderSelect,
    handlePdfFileSelect
  };
};