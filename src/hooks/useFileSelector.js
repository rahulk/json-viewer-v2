import { useState, useRef, useCallback } from 'react';
import { extractSectionCode } from '../utils/fileUtils';

/**
 * Custom hook for managing file selection and state reset
 * @param {Function} handleStateChange - Function to update component state
 * @param {string} tabType - Type of tab ('parsed' or 'enhanced')
 * @returns {Object} - Methods and state for file selection
 */
export const useFileSelector = (handleStateChange, tabType) => {
  const [selectedFile, setSelectedFile] = useState('');
  const sectionCodesByTabRef = useRef({});
  const previousFileRef = useRef(null);

  /**
   * Handle file selection and reset state when section code changes
   * @param {string} filename - The selected filename
   * @param {boolean} preserveState - If true, don't reset state even if section code changes
   */
  const handleFileSelect = useCallback((filename, preserveState = false) => {
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
    const currentSectionCode = sectionCodesByTabRef.current[tabType];
    
    console.log(`[${tabType}] File selected: ${filename}, section code: ${newSectionCode}, preserve state: ${preserveState}`);
    
    if (newSectionCode !== currentSectionCode && !preserveState) {
      console.log(`[${tabType}] Section code changed from ${currentSectionCode} to ${newSectionCode}, resetting state`);
      
      // First, update the section code reference for this tab
      sectionCodesByTabRef.current[tabType] = newSectionCode;
      
      // Reset state with a clean object to ensure complete reset
      handleStateChange({
        data: [], // Empty the data completely
        columnVisibility: {},
        columnWidths: {},
        columnOrder: [],
        wrapText: false,
        filterColoredText: false
      });
    } else if (preserveState) {
      console.log(`[${tabType}] Preserving state despite section code change from ${currentSectionCode} to ${newSectionCode}`);
      sectionCodesByTabRef.current[tabType] = newSectionCode;
    }
    
    setSelectedFile(filename);
  }, [handleStateChange, tabType]);

  // Reset when external dependencies change
  const resetSelection = useCallback(() => {
    delete sectionCodesByTabRef.current[tabType];
    previousFileRef.current = null;
    setSelectedFile('');
  }, [tabType]);

  return {
    selectedFile,
    handleFileSelect,
    resetSelection,
    sectionCode: selectedFile ? extractSectionCode(selectedFile) : null
  };
}; 