import { useState, useCallback, useRef } from 'react';
import { extractSectionCode } from '../utils/fileUtils';

/**
 * Custom hook for managing JSON file processing
 * @param {string} folderPath - The folder path containing JSON files
 * @param {Function} loadDisplayPreferences - Function to load display preferences
 * @returns {Object} - Methods and state for JSON processing
 */
export const useJsonProcessor = (folderPath, loadDisplayPreferences) => {
  const [isLoading, setIsLoading] = useState(false);
  const processingRef = useRef(false); // Track if processing is in progress
  const lastProcessedFile = useRef(null); // Track last processed file to prevent duplicate processing

  /**
   * Process a JSON file and apply saved preferences
   * @param {string} jsonType - Type of JSON ('parsed' or 'enhanced')
   * @param {string} filename - Name of the JSON file to process
   * @param {Function} updateState - Function to update component state
   */
  const processJsonFile = useCallback(async (jsonType, filename, updateState) => {
    // Prevent multiple simultaneous processing of the same file
    if (processingRef.current) {
      console.log(`⚠️ Already processing a file, ignoring request for ${filename}`);
      return;
    }
    
    // Prevent duplicate processing of the same file in quick succession
    const fileKey = `${jsonType}-${filename}`;
    if (lastProcessedFile.current === fileKey && isLoading) {
      console.log(`⚠️ Already processed ${filename} recently, ignoring duplicate request`);
      return;
    }
    
    if (!filename || !folderPath) {
      console.log(`❌ Missing required data for ${jsonType} JSON:`, { filename, folderPath });
      return;
    }

    // Set processing flags
    processingRef.current = true;
    lastProcessedFile.current = fileKey;
    setIsLoading(true);
    
    try {
      const subfolder = jsonType === 'parsed' ? 'parsed_jsons' : 'enhanced_jsons';
      const jsonPath = `${folderPath}/${subfolder}/${filename}`;
      console.log(`📤 Processing ${jsonType} JSON:`, jsonPath);

      // Load preferences first to have them ready
      const sectionCode = extractSectionCode(filename);
      let preferences = null;
      
      if (sectionCode) {
        try {
          console.log(`📂 Loading ${jsonType} preferences for section: ${sectionCode} before processing data`);
          preferences = await loadDisplayPreferences(jsonType, sectionCode);
          if (preferences && Object.keys(preferences).length > 0) {
            console.log(`✅ Found saved ${jsonType} preferences:`, {
              columns: Object.keys(preferences.selectedColumns || {}).length,
              widths: Object.keys(preferences.columnWidths || {}).length,
              orderLength: (preferences.columnOrder || []).length
            });
          } else {
            console.log(`⚠️ No saved ${jsonType} preferences found for ${sectionCode}`);
          }
        } catch (error) {
          console.error(`❌ Error pre-loading ${jsonType} preferences:`, error);
        }
      }

      // Then process the JSON file
      const response = await fetch(
        `http://localhost:3001/api/process-json?filePath=${encodeURIComponent(jsonPath)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to process ${jsonType} JSON: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      console.log(`📥 Received ${jsonType} JSON data:`, {
        records: Array.isArray(data.results) ? data.results.length : 'Not an array',
        success: data.success
      });
      
      // Apply data and preferences in a single update to prevent multiple renders
      if (preferences && Object.keys(preferences).length > 0) {
        console.log('Applying data and saved preferences together');
        updateState({
          data: data.results || [],
          columnVisibility: preferences.selectedColumns || {},
          columnWidths: preferences.columnWidths || {},
          columnOrder: preferences.columnOrder || [],
          lockedColumns: preferences.lockedColumns || []
        });
      } else {
        console.log('Applying data only, no saved preferences found');
        updateState({
          data: data.results || []
        });
      }
    } catch (error) {
      console.error(`❌ Error processing ${jsonType} JSON:`, error);
    } finally {
      // Clear processing flags with a small delay to prevent rapid re-triggering
      setTimeout(() => {
        processingRef.current = false;
        setIsLoading(false);
      }, 500);
    }
  }, [folderPath, loadDisplayPreferences, isLoading]);

  return {
    isLoading,
    processJsonFile
  };
}; 