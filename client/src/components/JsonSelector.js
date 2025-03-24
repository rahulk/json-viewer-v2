import React, { useState, useEffect } from 'react';

const JsonSelector = ({ selectedPdf, folderPath, onParsedJsonSelect, onEnhancedJsonSelect }) => {
  const [parsedJsons, setParsedJsons] = useState([]);
  const [enhancedJsons, setEnhancedJsons] = useState([]);
  const [selectedParsedJson, setSelectedParsedJson] = useState('');
  const [selectedEnhancedJson, setSelectedEnhancedJson] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch JSON files whenever the selected PDF changes
  useEffect(() => {
    if (!selectedPdf) return;
    
    setLoading(true);
    setError(null);
    
    // Extract just the filename from the path if it contains path separators
    const pdfFilename = selectedPdf.includes('/') 
      ? selectedPdf.split('/').pop() 
      : selectedPdf;
    
    console.log('Fetching JSON files for PDF:', pdfFilename);
    
    // Call both API endpoints in parallel
    Promise.all([
      fetchParsedJsons(folderPath, pdfFilename),
      fetchEnhancedJsons(folderPath, pdfFilename)
    ])
      .then(([parsedData, enhancedData]) => {
        setParsedJsons(parsedData.jsonFiles || []);
        setEnhancedJsons(enhancedData.jsonFiles || []);
        
        // Reset selections
        setSelectedParsedJson('');
        setSelectedEnhancedJson('');
        
        console.log('Fetched parsed JSONs:', parsedData.jsonFiles);
        console.log('Fetched enhanced JSONs:', enhancedData.jsonFiles);
      })
      .catch(err => {
        console.error('Error fetching JSON files:', err);
        setError('Failed to load JSON files. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedPdf, folderPath]);

  // Fetch parsed JSONs from the API
  const fetchParsedJsons = async (folderPath, pdfFilename) => {
    const response = await fetch(`/api/parsed-jsons?folderPath=${encodeURIComponent(folderPath)}&pdfFilename=${encodeURIComponent(pdfFilename)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch parsed JSONs');
    }
    
    return response.json();
  };

  // Fetch enhanced JSONs from the API
  const fetchEnhancedJsons = async (folderPath, pdfFilename) => {
    const response = await fetch(`/api/enhanced-jsons?folderPath=${encodeURIComponent(folderPath)}&pdfFilename=${encodeURIComponent(pdfFilename)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch enhanced JSONs');
    }
    
    return response.json();
  };

  // Handle parsed JSON selection
  const handleParsedJsonChange = (e) => {
    const selectedJson = e.target.value;
    setSelectedParsedJson(selectedJson);
    
    if (onParsedJsonSelect && selectedJson) {
      onParsedJsonSelect(selectedJson);
    }
  };

  // Handle enhanced JSON selection
  const handleEnhancedJsonChange = (e) => {
    const selectedJson = e.target.value;
    setSelectedEnhancedJson(selectedJson);
    
    if (onEnhancedJsonSelect && selectedJson) {
      onEnhancedJsonSelect(selectedJson);
    }
  };

  return (
    <div className="json-selector">
      {loading && <div className="loading">Loading JSON files...</div>}
      {error && <div className="error">{error}</div>}
      
      {/* Tab 4: Parsed JSON Dropdown */}
      <div className="json-selector-section">
        <h3>Parsed JSON Files</h3>
        <select 
          value={selectedParsedJson}
          onChange={handleParsedJsonChange}
          disabled={loading || parsedJsons.length === 0}
        >
          <option value="">Select a parsed JSON file</option>
          {parsedJsons.map((json, index) => (
            <option key={index} value={json}>
              {json}
            </option>
          ))}
        </select>
        {parsedJsons.length === 0 && !loading && (
          <p className="no-files">No parsed JSON files found for this PDF</p>
        )}
      </div>
      
      {/* Tab 5: Enhanced JSON Dropdown */}
      <div className="json-selector-section">
        <h3>Enhanced JSON Files</h3>
        <select 
          value={selectedEnhancedJson}
          onChange={handleEnhancedJsonChange}
          disabled={loading || enhancedJsons.length === 0}
        >
          <option value="">Select an enhanced JSON file</option>
          {enhancedJsons.map((json, index) => (
            <option key={index} value={json}>
              {json}
            </option>
          ))}
        </select>
        {enhancedJsons.length === 0 && !loading && (
          <p className="no-files">No enhanced JSON files found for this PDF</p>
        )}
      </div>
    </div>
  );
};

export default JsonSelector; 