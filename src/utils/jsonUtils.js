/**
 * Utility functions for JSON formatting and rendering
 */

import React from 'react';

/**
 * Renders JSON data with syntax highlighting
 * @param {Object|Array} jsonData - The JSON data to display
 * @returns {string} HTML string with syntax highlighting
 */
export const renderHighlightedJson = (jsonData) => {
  // Generate highlighted JSON with proper indentation and coloring
  if (!jsonData) return '';
  
  const jsonString = JSON.stringify(jsonData, null, 2);
  
  // Process the JSON string to add syntax highlighting
  // eslint-disable-next-line no-useless-escape
  return jsonString.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let className = 'json-number'; // number
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          className = 'json-key'; // key
        } else {
          className = 'json-string'; // string
        }
      } else if (/true|false/.test(match)) {
        className = 'json-boolean'; // boolean
      } else if (/null/.test(match)) {
        className = 'json-null'; // null
      }
      return `<span class="${className}">${match}</span>`;
    }
  );
};

/**
 * Formats a JSON string with proper indentation and line breaks
 * @param {string} jsonString - The JSON string to format
 * @returns {string} Formatted JSON string
 */
export const formatJsonString = (jsonString) => {
  try {
    const obj = JSON.parse(jsonString);
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    console.error('Invalid JSON string:', e);
    return jsonString; // Return the original string if it's not valid JSON
  }
};

/**
 * Safely parses JSON with error handling
 * @param {string} jsonString - The JSON string to parse
 * @param {*} defaultValue - Default value to return if parsing fails
 * @returns {Object|Array|*} Parsed JSON or default value
 */
export const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return defaultValue;
  }
};

/**
 * Collapses a JSON string to a single line (minifies)
 * @param {string} jsonString - The JSON string to collapse
 * @returns {string} Minified JSON string
 */
export const minifyJson = (jsonString) => {
  try {
    const obj = JSON.parse(jsonString);
    return JSON.stringify(obj);
  } catch (e) {
    console.error('Invalid JSON string:', e);
    return jsonString;
  }
};

/**
 * Search for text in a JSON object and return paths to matching nodes
 * @param {Object|Array} json - JSON object to search
 * @param {string} searchText - Text to search for (case-insensitive)
 * @returns {Array} Array of paths to matching nodes
 */
export const searchJsonForText = (json, searchText) => {
  if (!searchText || !json) return [];
  
  const results = [];
  const searchTextLower = searchText.toLowerCase();
  
  const searchInNode = (obj, path = []) => {
    if (!obj || typeof obj !== 'object') return;
    
    Object.entries(obj).forEach(([key, value]) => {
      const currentPath = [...path, key];
      
      // Check if key contains the search text
      if (key.toLowerCase().includes(searchTextLower)) {
        results.push({ path: currentPath, matchIn: 'key' });
      }
      
      if (value === null) {
        // Skip null values
        return;
      } else if (typeof value === 'object') {
        // Recursively search in objects and arrays
        searchInNode(value, currentPath);
      } else {
        // Check if primitive value contains the search text
        const valueStr = String(value).toLowerCase();
        if (valueStr.includes(searchTextLower)) {
          results.push({ path: currentPath, matchIn: 'value' });
        }
      }
    });
  };
  
  searchInNode(json);
  return results;
};

/**
 * Custom React component to render JSON with left alignment
 */
export const CustomJsonView = ({ data, searchTerm = '', searchResults = [] }) => {
  // Function to check if a path should be highlighted (for path-based search results)
  const shouldHighlightPath = (path) => {
    if (!searchResults || searchResults.length === 0) return false;
    
    // Convert current path to string for easier comparison
    const pathStr = path.join('.');
    
    // Check if any search result path matches or contains this path
    return searchResults.some(result => {
      const resultPathStr = result.path.join('.');
      return resultPathStr.includes(pathStr) || pathStr.includes(resultPathStr);
    });
  };
  
  const renderValue = (value, isKey = false, level = 0, path = []) => {
    // Handle different data types
    if (value === null) {
      return <span className="json-null">null</span>;
    }
    
    if (typeof value === 'boolean') {
      return <span className="json-boolean">{String(value)}</span>;
    }
    
    if (typeof value === 'number') {
      return <span className="json-number">{value}</span>;
    }
    
    if (typeof value === 'string') {
      // Highlight matches if there's a search term
      if (searchTerm && value.toLowerCase().includes(searchTerm.toLowerCase())) {
        return <span className="json-string json-highlight">"{value}"</span>;
      }
      
      // Also highlight if the path is in search results
      if (shouldHighlightPath(path)) {
        return <span className={isKey ? "json-key json-highlight-path" : "json-string json-highlight-path"}>"{value}"</span>;
      }
      
      return <span className={isKey ? "json-key" : "json-string"}>"{value}"</span>;
    }
    
    // Handle objects and arrays
    if (Array.isArray(value)) {
      if (value.length === 0) return <span>[ ]</span>;
      
      const isHighlighted = shouldHighlightPath(path);
      
      return (
        <div className={`json-array ${isHighlighted ? 'json-highlight-path' : ''}`} style={{ paddingLeft: level > 0 ? '20px' : '0' }}>
          <span className="json-bracket">[</span>
          <div className="json-array-items">
            {value.map((item, index) => (
              <div key={index} className="json-array-item" style={{ textAlign: 'left' }}>
                <span className="json-array-marker">▸</span> {renderValue(item, false, level + 1, [...path, index])}
                {index < value.length - 1 && <span>,</span>}
              </div>
            ))}
          </div>
          <span className="json-bracket">]</span>
        </div>
      );
    }
    
    // It's an object
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return <span>{ }</span>;
      
      const isHighlighted = shouldHighlightPath(path);
      
      return (
        <div className={`json-object ${isHighlighted ? 'json-highlight-path' : ''}`} style={{ paddingLeft: level > 0 ? '20px' : '0' }}>
          <span className="json-bracket">{'{'}</span>
          <div className="json-object-properties">
            {entries.map(([key, propValue], index) => {
              const isKeyMatch = searchTerm && key.toLowerCase().includes(searchTerm.toLowerCase());
              const propPath = [...path, key];
              const isPathMatch = shouldHighlightPath(propPath);
              
              return (
                <div key={key} className={`json-property ${isKeyMatch ? 'json-highlight-key' : ''} ${isPathMatch ? 'json-highlight-path' : ''}`} style={{ textAlign: 'left' }}>
                  <span className="json-property-key">
                    <span className="json-array-marker">▸</span> {renderValue(key, true, level, propPath)}:
                  </span>{' '}
                  <span className="json-property-value">
                    {renderValue(propValue, false, level + 1, propPath)}
                  </span>
                  {index < entries.length - 1 && <span>,</span>}
                </div>
              );
            })}
          </div>
          <span className="json-bracket">{'}'}</span>
        </div>
      );
    }
    
    // Fallback for any other type
    return <span>{String(value)}</span>;
  };
  
  return (
    <div className="custom-json-renderer" style={{ textAlign: 'left', width: '100%' }}>
      {renderValue(data, false, 0, [])}
    </div>
  );
}; 