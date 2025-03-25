import { useState, useCallback } from 'react';
import { JsonProcessor } from '../utils/JsonProcessor';
import { SAMPLE_JSON } from '../constants/sampleData';

export const useJsonProcessing = () => {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize with completely separate state objects for each tab
  const [tab4State, setTab4State] = useState({
    data: [],
    columnVisibility: {},
    filters: {},
    wrapText: false,
    filterColoredText: false
  });

  const [tab5State, setTab5State] = useState({
    data: [], 
    columnVisibility: {},
    filters: {},
    wrapText: false,
    filterColoredText: false
  });

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

  // Modified to keep each tab's state completely independent
  const processFiles = async () => {
    if (files.length === 0) {
      const processor = new JsonProcessor();
      const processedData = processor.processArray(SAMPLE_JSON);
      
      if (processedData && processedData.results) {
        // Update tab4State, preserving all its settings except data
        setTab4State(prevState => ({
          ...prevState,
          data: [...processedData.results] // Use a fresh copy of the data
        }));
        
        // Update tab5State, preserving all its settings except data
        setTab5State(prevState => ({
          ...prevState,
          data: [...processedData.results] // Use a fresh copy of the data
        }));

        setResults([{
          name: 'sample-data.json',
          data: processedData,
          rawData: SAMPLE_JSON
        }]);
        setActiveFile(0);
      } else {
        console.error("Invalid processed data structure:", processedData);
        setError("Error processing sample data");
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const processedFiles = [];
      const processor = new JsonProcessor();
      
      for (const file of files) {
        const content = await readFileAsJson(file);
        const dataToProcess = Array.isArray(content) ? content : [content];
        const processed = processor.processArray(dataToProcess);
        
        if (processed && processed.results) {
          processedFiles.push({
            name: file.name,
            data: processed,
            rawData: content
          });

          // Update tab states with copies of the data to ensure independence
          setTab4State(prevState => ({
            ...prevState,
            data: [...processed.results]
          }));
          
          setTab5State(prevState => ({
            ...prevState,
            data: [...processed.results]
          }));
        } else {
          throw new Error(`Invalid processed data structure for file: ${file.name}`);
        }
      }
      
      setResults(processedFiles);
      if (processedFiles.length > 0) {
        setActiveFile(0);
      }
      
    } catch (err) {
      console.error("Error processing files:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Ensure these handlers properly merge the state updates
  const handleTab4StateChange = useCallback((newState) => {
    // Check if this is a reset operation (data is empty array)
    const isReset = newState.data && Array.isArray(newState.data) && newState.data.length === 0;
    
    setTab4State(prevState => {
      // For a reset operation, don't merge with previous state
      if (isReset) {
        console.log('Detected tab4 reset operation, replacing entire state');
        return newState;
      }
      
      // For deep objects, we need to ensure we're properly merging
      const newStateObj = { ...prevState };
      
      // Handle nested objects like columnVisibility
      if (newState.columnVisibility) {
        newStateObj.columnVisibility = {
          ...prevState.columnVisibility,
          ...newState.columnVisibility
        };
      }
      
      // Handle nested objects like filters
      if (newState.filters) {
        newStateObj.filters = {
          ...prevState.filters,
          ...newState.filters
        };
      }
      
      // Handle other flat properties
      return {
        ...newStateObj,
        ...newState,
        // Restore the properly merged deep objects to override the shallow merge above
        ...(newState.columnVisibility ? { columnVisibility: newStateObj.columnVisibility } : {}),
        ...(newState.filters ? { filters: newStateObj.filters } : {})
      };
    });
  }, []);

  const handleTab5StateChange = useCallback((newState) => {
    // Check if this is a reset operation (data is empty array)
    const isReset = newState.data && Array.isArray(newState.data) && newState.data.length === 0;
    
    setTab5State(prevState => {
      // For a reset operation, don't merge with previous state
      if (isReset) {
        console.log('Detected tab5 reset operation, replacing entire state');
        return newState;
      }
      
      // For deep objects, we need to ensure we're properly merging
      const newStateObj = { ...prevState };
      
      // Handle nested objects like columnVisibility
      if (newState.columnVisibility) {
        newStateObj.columnVisibility = {
          ...prevState.columnVisibility,
          ...newState.columnVisibility
        };
      }
      
      // Handle nested objects like filters
      if (newState.filters) {
        newStateObj.filters = {
          ...prevState.filters,
          ...newState.filters
        };
      }
      
      // Handle other flat properties
      return {
        ...newStateObj,
        ...newState,
        // Restore the properly merged deep objects to override the shallow merge above
        ...(newState.columnVisibility ? { columnVisibility: newStateObj.columnVisibility } : {}),
        ...(newState.filters ? { filters: newStateObj.filters } : {})
      };
    });
  }, []);

  const resetTabStates = useCallback(() => {
    // Completely reset tab states to initial values
    console.log('Completely resetting tab states to initial values');
    
    const initialState = {
      data: [],
      columnVisibility: {},
      filters: {},
      wrapText: false,
      filterColoredText: false,
      columnWidths: {},
      columnOrder: []
    };
    
    setTab4State(initialState);
    setTab5State(initialState);
    
    console.log('Tab states have been reset to:', initialState);
  }, []);
  
  return {
    files,
    setFiles,
    results,
    activeFile,
    isLoading,
    error,
    tab4State,
    tab5State,
    processFiles,
    handleTab4StateChange,
    handleTab5StateChange,
    resetTabStates
  };
};