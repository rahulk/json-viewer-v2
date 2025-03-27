import { useState, useRef, useCallback } from 'react';
import { extractSectionCode } from '../utils/fileUtils';

/**
 * Custom hook for managing file selection and state reset
 * @param {Function} handleStateChange - Function to update component state
 * @returns {Object} - Methods and state for file selection
 */
export const useFileSelector = (handleStateChange) => {
  const [selectedFile, setSelectedFile] = useState('');
  const previousSectionCodeRef = useRef(null);
  const previousFileRef = useRef(null);

  /**
   * Handle file selection and reset state when section code changes
   * @param {string} filename - The selected filename
   */
  const handleFileSelect = useCallback((filename) => {
    if (!filename) {
      console.log('No file selected, ignoring');
      return;
    }
    
    // Prevent duplicate selections of the same file
    if (filename === previousFileRef.current) {
      console.log(`Already selected ${filename}, ignoring duplicate selection`);
      return;
    }
    
    previousFileRef.current = filename;
    const newSectionCode = extractSectionCode(filename);
    const currentSectionCode = previousSectionCodeRef.current;
    
    console.log(`File selected: ${filename}, section code: ${newSectionCode}`);
    
    if (newSectionCode !== currentSectionCode) {
      console.log(`Section code changed from ${currentSectionCode} to ${newSectionCode}, resetting state`);
      
      // First, update the section code reference
      previousSectionCodeRef.current = newSectionCode;
      
      // Reset state with a clean object to ensure complete reset
      handleStateChange({
        data: [], // Empty the data completely
        columnVisibility: {},
        columnWidths: {},
        columnOrder: [],
        wrapText: false,
        filterColoredText: false
      });
    }
    
    setSelectedFile(filename);
  }, [handleStateChange]);

  // Reset when external dependencies change
  const resetSelection = useCallback(() => {
    previousSectionCodeRef.current = null;
    previousFileRef.current = null;
    setSelectedFile('');
  }, []);

  return {
    selectedFile,
    handleFileSelect,
    resetSelection,
    sectionCode: selectedFile ? extractSectionCode(selectedFile) : null
  };
}; 