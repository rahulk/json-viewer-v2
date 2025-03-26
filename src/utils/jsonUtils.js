/**
 * Utility functions for JSON formatting and rendering
 */

import React from 'react';
import ReactJsonView from 'react-json-view';

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
 * Custom React component to render JSON with better collapsible functionality
 */
export const CustomJsonView = ({ 
  data, 
  searchTerm = '', 
  searchResults = [],
  enableClipboard = false,
  enableCollapse = true,
  collapseStringsAfterLength = 100,
  displayDataTypes = false,
  displayObjectSize = true,
  indentWidth = 2,
  collapsed = false
}) => {
  // Configure color based on theme preference
  const darkTheme = document.body.classList.contains('dark-theme') ||
                   (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Apply custom renderer functions for search terms
  const customLabelRenderer = searchTerm ? (keyPath, keyName, data) => {
    if (typeof keyName === 'string' && searchTerm && keyName.toLowerCase().includes(searchTerm.toLowerCase())) {
      const parts = keyName.split(new RegExp(`(${searchTerm})`, 'gi'));
      return (
        <span>
          {parts.map((part, i) => 
            part.toLowerCase() === searchTerm.toLowerCase() 
              ? <span key={i} className="search-highlight">{part}</span> 
              : part
          )}
        </span>
      );
    }
    return undefined;
  } : undefined;

  const customValueRenderer = searchTerm ? (key, value) => {
    if (typeof value === 'string' && searchTerm && value.toLowerCase().includes(searchTerm.toLowerCase())) {
      const parts = value.split(new RegExp(`(${searchTerm})`, 'gi'));
      return (
        <span>
          {parts.map((part, i) => 
            part.toLowerCase() === searchTerm.toLowerCase() 
              ? <span key={i} className="search-highlight">{part}</span> 
              : part
          )}
        </span>
      );
    }
    return undefined;
  } : undefined;

  return (
    <ReactJsonView
      src={data}
      name={null}
      theme={darkTheme ? "monokai" : "rjv-default"}
      collapsed={collapsed ? 1 : false}
      displayDataTypes={displayDataTypes}
      displayObjectSize={displayObjectSize}
      enableClipboard={enableClipboard}
      indentWidth={indentWidth}
      collapseStringsAfterLength={collapseStringsAfterLength}
      iconStyle="triangle"
      style={{
        fontFamily: 'Monaco, Menlo, Consolas, monospace',
        fontSize: '13px',
        lineHeight: '1.4',
        width: '100%',
        height: '100%',
        overflow: 'auto',
        padding: '12px',
        backgroundColor: 'transparent',
        textAlign: 'left'
      }}
      quotesOnKeys={false}
      onSelect={(select) => {
        // Auto-expand nodes when selected
        if (select.namespace.length > 0) {
          // This helps ensure the selected node is visible
          return true;
        }
      }}
      // Apply the custom search highlighting renderers
      labelRenderer={customLabelRenderer}
      valueRenderer={customValueRenderer}
      // Enable editing functions (all disabled)
      onEdit={false}
      onDelete={false}
      onAdd={false}
      // This works for auto-expanding matching nodes when there's a search term
      shouldExpandNode={(keyPath, data, level) => {
        if (collapsed) return false;
        
        // Always expand root node
        if (keyPath.length === 0) return true;
        
        // If there's a search term, expand nodes containing search results
        if (searchTerm && searchResults.length > 0) {
          // Convert keyPath to a string format for easier comparison
          const currentPath = keyPath.join('.');
          
          // Check if any search result contains this path as a prefix
          return searchResults.some(result => {
            if (!result.path) return false;
            const resultPath = result.path.join('.');
            return resultPath.startsWith(currentPath);
          });
        }
        
        // Default based on level
        return level < 2; // Expand first two levels by default
      }}
    />
  );
}; 