import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { flattenNestedData } from '../utils/dataUtils';
import PropTypes from 'prop-types';
import { searchJsonForText, CustomJsonView } from '../utils/jsonUtils';
import 'react-json-view-lite/dist/index.css';

// ImageModal component for enlarged image view
const ImageModal = ({ src, alt, onClose }) => (
  <div 
    className="image-modal-overlay"
    onClick={onClose}
  >
    <div className="image-modal-content">
      <img src={src} alt={alt} />
      <button 
        className="btn btn-outline-light close-button"
        onClick={onClose}
      >
        Close
      </button>
    </div>
  </div>
);

export const FlatDataTable = React.forwardRef(({
  data,
  sectionCode,
  initialColumnVisibility = {},
  initialColumnWidths = {}, 
  initialColumnOrder = [], 
  onStateChange,
  showColumnSelection = true,
  allowTextWrapping = true,
  showColorHighlighting = true,
  title,
  componentId = 'default'
}, ref) => {
  const [selectedColumns, setSelectedColumns] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColoredText, setFilterColoredText] = useState(false);
  const [wrapText, setWrapText] = useState(false);
  const [columnWidths, setColumnWidths] = useState(initialColumnWidths);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [jsonDarkTheme, setJsonDarkTheme] = useState(false);
  const [jsonSearchTerm, setJsonSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchResultCount, setSearchResultCount] = useState(0);
  const [jsonExpanded, setJsonExpanded] = useState(true);
  const [currentSearchResultIndex, setCurrentSearchResultIndex] = useState(0);
  const jsonViewerRef = useRef(null);
  const isInitialized = useRef(false); // Tracks if the component has been initialized with preferences for the current data structure
  const previousStateRef = useRef(null);
  const previousSectionCode = useRef(sectionCode);
  const mountedRef = useRef(false);
  const preferenceLoadedRef = useRef(false);
  const stickyStyleRef = useRef(null);
  
  // New state for column ordering
  const [columnOrder, setColumnOrder] = useState(initialColumnOrder.length > 0 ? initialColumnOrder : []);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [recentlyHiddenColumns, setRecentlyHiddenColumns] = useState([]);

  // Track data changes and prevent duplicate initializations
  const previousDataRef = useRef(null);
  
  // Process data and get keys first - move this before the effects that use it
  const processedData = useMemo(() => {
    if (!data || data.length === 0) {
      return { flattenedRows: [], fieldOrder: [], keys: [] };
    }

    const flattenedData = flattenNestedData(data);
    const allKeys = new Set([...flattenedData.fieldOrder]);
    flattenedData.rows.forEach(item => {
      Object.keys(item).forEach(key => allKeys.add(key));
    });

    return {
      flattenedRows: flattenedData.rows,
      fieldOrder: flattenedData.fieldOrder,
      keys: Array.from(allKeys)
    };
  }, [data]);
  
  // Prevent resetting state on component remount due to tab change
  useEffect(() => {
    // If this is the first mount, set the mounted flag
    if (!mountedRef.current) {
      mountedRef.current = true;
      console.log(`FlatDataTable ${componentId} initialized for first time`);
    } else {
      console.log(`FlatDataTable ${componentId} remounted, preserving state`);
    }
  }, [componentId]);

  // Reset state ONLY when sectionCode changes, not when tabs switch
  useEffect(() => {
    if (sectionCode !== previousSectionCode.current && sectionCode) {
      console.log('Section code changed from', previousSectionCode.current, 'to', sectionCode);
      console.log('Resetting state for new section code');
      
      // Reset all state to initial values
      setSelectedColumns({});
      setColumnWidths({});
      setColumnOrder([]);
      setFilterColoredText(false);
      setWrapText(false);
      setShowColumnSelector(false);
      setSearchTerm('');
      setShowRawJson(false);
      setJsonDarkTheme(false);
      setJsonSearchTerm('');
      setSearchResults([]);
      setSearchResultCount(0);
      setJsonExpanded(true);
      
      // Reset initialized flag to trigger reinitialization
      isInitialized.current = false;
      preferenceLoadedRef.current = false;
      previousDataRef.current = null;
      
      // Update the reference
      previousSectionCode.current = sectionCode;
    }
  }, [sectionCode]);

  // Track when data changes
  useEffect(() => {
    // If it's the first data assignment or data is empty, just update the ref
    if (previousDataRef.current === null || !data || data.length === 0) {
      previousDataRef.current = data;
      return;
    }
    
    // Check if the data structure has changed by comparing available keys
    const currentKeys = processedData.keys;
    const previousKeys = previousDataRef.current ? 
      flattenNestedData(previousDataRef.current).fieldOrder : [];
    
    // Compare current and previous data structure
    const keysChanged = 
      currentKeys.length !== previousKeys.length || 
      JSON.stringify(currentKeys.sort()) !== JSON.stringify(previousKeys.sort());
      
    if (keysChanged) {
      console.log('Data structure changed (different columns) for the same section code, reinitializing preferences');
      // Reset preference flags to trigger reinitialization with the new data structure
      preferenceLoadedRef.current = false;
      isInitialized.current = false;
    } else {
      // Check if the data content actually changed
      const prevDataStr = JSON.stringify(previousDataRef.current);
      const currentDataStr = JSON.stringify(data);
      
      if (prevDataStr !== currentDataStr) {
        console.log('Data content changed but structure remains the same, preserving preferences');
      }
    }
    
    // Update the reference
    previousDataRef.current = data;
  }, [data, processedData.keys]);

  // Move initializeWithDefaults before loadPreferences to avoid circular dependency
  const initializeWithDefaults = useCallback(() => {
    if (!processedData.keys.length) return;
    
    console.log('Initializing with defaults');
    
    // Use initialColumnVisibility if provided, otherwise set all columns visible
    const initVisibility = Object.keys(initialColumnVisibility).length > 0
      ? { ...initialColumnVisibility }
      : Object.fromEntries(processedData.keys.map(key => [key, true]));
    
    // Filter to only include valid columns that exist in the current dataset
    const validVisibility = {};
    processedData.keys.forEach(key => {
      // Default new columns to visible
      validVisibility[key] = initVisibility[key] !== undefined ? initVisibility[key] : true;
    });
    
    // Set column visibility
    setSelectedColumns(validVisibility);
    
    // Use initialColumnWidths if provided, but only for columns that exist in this dataset
    if (Object.keys(initialColumnWidths).length > 0) {
      const validWidths = {};
      // Only keep widths for columns that exist in the current dataset
      Object.keys(initialColumnWidths).forEach(key => {
        if (processedData.keys.includes(key)) {
          validWidths[key] = initialColumnWidths[key];
        }
      });
      
      // Add default widths for any new columns not in saved preferences
      processedData.keys.forEach(key => {
        if (!validWidths[key]) {
          validWidths[key] = 200; // Default width
        }
      });
      
      setColumnWidths(validWidths);
    } else {
      // No saved widths, set defaults for all columns
      setColumnWidths(Object.fromEntries(processedData.keys.map(key => [key, 200])));
    }
    
    // Use initialColumnOrder if provided, otherwise use keys order
    if (initialColumnOrder.length > 0) {
      // Filter out columns from the saved order that don't exist in the current dataset
      const validOrder = initialColumnOrder.filter(col => 
        processedData.keys.includes(col)
      );
      
      // Create a new order with valid columns from saved preferences, then add any new columns
      const newOrder = [...validOrder];
      processedData.keys.forEach(key => {
        if (!newOrder.includes(key)) {
          newOrder.push(key);
        }
      });
      
      setColumnOrder(newOrder);
    } else {
      setColumnOrder([...processedData.keys]);
    }
    
    console.log('Initialized component with', processedData.keys.length, 'columns from current dataset');
    preferenceLoadedRef.current = true;
    isInitialized.current = true;
  }, [processedData.keys, initialColumnVisibility, initialColumnWidths, initialColumnOrder]);

  // Main initialization effect
  useEffect(() => {
    if (!isInitialized.current && processedData.keys.length > 0 && sectionCode) {
      console.log(`Initializing FlatDataTable for section ${sectionCode} with ${processedData.keys.length} columns`);
      
      // Check if we're using saved preferences or defaults
      if (Object.keys(initialColumnVisibility).length > 0) {
        console.log('Using preferences from props:', {
          visibleColumns: Object.keys(initialColumnVisibility).length,
          columnWidths: Object.keys(initialColumnWidths).length,
          orderColumns: initialColumnOrder.length
        });
      } else {
        console.log('No saved preferences provided, using defaults');
      }
      
      // Initialize the component with the provided or default preferences
      initializeWithDefaults();
      isInitialized.current = true;
      preferenceLoadedRef.current = true;
    }
  }, [sectionCode, processedData.keys, initializeWithDefaults, initialColumnVisibility, initialColumnWidths, initialColumnOrder]);

  // NEW EFFECT: Add sticky header functionality
  useEffect(() => {
    if (!processedData.flattenedRows.length) return;
    
    // Function to apply sticky headers
    const applyFixedHeaders = () => {
      // Clean up any existing style
      if (stickyStyleRef.current) {
        stickyStyleRef.current.remove();
        stickyStyleRef.current = null;
      }
      
      // Create a new style element
      const style = document.createElement('style');
      style.id = `sticky-headers-${componentId}`;
      
      // Define CSS to fix the headers
      style.textContent = `
        /* Core table container styles */
        .table-container {
          overflow: auto !important;
          position: relative !important;
        }

        /* Fix table structure for sticky headers */
        .data-table {
          border-collapse: separate !important;
          border-spacing: 0 !important;
        }

        /* Make thead sticky */
        .data-table thead {
          position: -webkit-sticky !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 1000 !important;
          background-color: #f5f5f5 !important;
        }

        /* Make th cells sticky */
        .data-table th {
          position: -webkit-sticky !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 1000 !important;
          background-color: #f5f5f5 !important;
          box-shadow: 0 2px 3px rgba(0,0,0,0.1) !important;
        }

        /* Ensure header content is visible */
        .data-table th .header-content {
          position: relative !important;
          z-index: 1001 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
        }

        /* Hide column button styling */
        .hide-column-btn {
          opacity: 0.2;
          background: none;
          border: none;
          font-size: 12px;
          cursor: pointer;
          padding: 2px 5px;
          border-radius: 2px;
          margin-left: 5px;
        }
        
        .hide-column-btn:hover {
          opacity: 1;
          background-color: #e0e0e0;
        }

        /* Recently hidden columns styles */
        .recently-hidden-columns {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          background-color: #f9f9f9;
          border-bottom: 1px solid #ddd;
          margin-bottom: 5px;
        }
        
        .recently-hidden-label {
          font-size: 0.85rem;
          color: #666;
          margin-right: 5px;
        }
        
        .restore-column-btn {
          font-size: 0.8rem;
          padding: 2px 8px;
          white-space: nowrap;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .restore-icon {
          font-weight: bold;
          margin-left: 3px;
        }
        
        .clear-recent {
          font-size: 0.8rem;
          padding: 2px 8px;
          margin-left: auto;
        }

        /* JSON Viewer styles */
        .raw-json-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .json-viewer-wrapper {
          flex-grow: 1;
          overflow: auto;
          padding: 10px;
          height: calc(100vh - 150px);
          position: relative;
        }
        
        .json-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background-color: #f5f5f5;
          border-bottom: 1px solid #ddd;
        }
        
        .json-search {
          display: flex;
          align-items: center;
          flex: 1;
          margin-right: 10px;
        }
        
        .json-search-input {
          flex: 1;
          padding: 4px 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .json-view-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .search-count {
          margin-left: 8px;
          font-size: 12px;
          color: #666;
          background: #e9ecef;
          padding: 2px 6px;
          border-radius: 10px;
          white-space: nowrap;
        }
        
        .search-navigation {
          display: flex;
          gap: 2px;
          margin-left: 5px;
        }
        
        .nav-btn {
          padding: 0px 4px;
          font-size: 12px;
          line-height: 1.2;
        }
        
        .mr-2 {
          margin-right: 8px;
        }
        
        /* Enhance collapse/expand buttons */
        .raw-json-container [aria-label="collapse"] {
          cursor: pointer !important;
          color: #0275d8 !important;
          font-weight: bold !important;
          margin-right: 5px !important;
          user-select: none !important;
        }
        
        .raw-json-container [aria-label="expand"] {
          cursor: pointer !important;
          color: #0275d8 !important;
          font-weight: bold !important;
          margin-right: 5px !important;
          user-select: none !important;
        }

        /* Highlight JSON search results */
        .json-search-highlight {
          background-color: yellow !important;
          padding: 0 2px !important;
          border-radius: 2px !important;
        }
        
        .current-highlight {
          background-color: orange !important;
          outline: 2px solid #ff4500 !important;
          transition: background-color 0.3s ease-out !important;
        }
        
        /* Dark theme styles */
        .raw-json-container[data-theme="dark"] {
          background-color: #1e1e1e;
          color: #d4d4d4;
        }
        
        .raw-json-container[data-theme="dark"] .json-controls {
          background-color: #2d2d2d;
          border-color: #444;
        }
        
        .raw-json-container[data-theme="dark"] .json-search-input {
          background-color: #333;
          border-color: #555;
          color: #fff;
        }
        
        .raw-json-container[data-theme="dark"] .search-count {
          background-color: #444;
          color: #ddd;
        }
        
        .raw-json-container[data-theme="dark"] .json-search-highlight {
          background-color: #806300 !important;
          color: #fff !important;
        }

        /* React JSON View Customizations */
        .react-json-view {
          background-color: transparent !important;
          width: 100% !important;
          height: auto !important;
          overflow: visible !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .raw-json-container .variable-row, 
        .raw-json-container .object-key-val {
          border-left: none !important;
          padding-top: 4px !important;
          padding-bottom: 4px !important;
          min-height: auto !important;
          margin-top: 1px !important;
          margin-bottom: 1px !important;
        }
        
        .raw-json-container .variable-row:hover, 
        .raw-json-container .object-key-val:hover {
          background-color: rgba(0, 0, 0, 0.05) !important;
          border-radius: 3px !important;
        }
        
        .raw-json-container[data-theme="dark"] .variable-row:hover, 
        .raw-json-container[data-theme="dark"] .object-key-val:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
        
        .raw-json-container .icon-container svg {
          cursor: pointer !important;
          margin-right: 5px !important;
        }
        
        .raw-json-container .search-highlight {
          background-color: #ffff00 !important;
          color: #000000 !important;
          border-radius: 2px !important;
          padding: 0 2px !important;
        }
        
        .raw-json-container[data-theme="dark"] .search-highlight {
          background-color: #806300 !important;
          color: #ffffff !important;
        }

        /* Make sure resize handles stay above content */
        .resize-handle {
          position: absolute !important;
          z-index: 1002 !important;
        }

        /* Fix for Firefox */
        @-moz-document url-prefix() {
          .data-table thead,
          .data-table th {
            position: sticky !important;
            top: 0 !important;
          }
        }
      `;
      
      // Add the style to the document head
      document.head.appendChild(style);
      
      // Save reference for cleanup
      stickyStyleRef.current = style;
      
      // Log for debugging
      console.log('Applied sticky header styles for', componentId);
      
      return style;
    };
    
    // Apply sticky headers
    const styleElement = applyFixedHeaders();
    
    // Clean up function
    return () => {
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
      stickyStyleRef.current = null;
    };
  }, [processedData.flattenedRows, componentId]);

  // Handle JSON search and navigation
  useEffect(() => {
    if (jsonSearchTerm.trim() && data) {
      const results = searchJsonForText(data, jsonSearchTerm);
      setSearchResults(results);
      setSearchResultCount(results.length);
      setCurrentSearchResultIndex(0); // Reset to first result
      
      // When searching, automatically expand the JSON view to show results
      setJsonExpanded(true);
      
      // Auto-scroll to first result if found
      if (results.length > 0 && jsonViewerRef.current) {
        setTimeout(() => {
          const highlightedEl = jsonViewerRef.current.querySelector('.search-highlight');
          if (highlightedEl) {
            highlightedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300); // Slightly longer timeout to allow for expansion
      }
    } else {
      setSearchResults([]);
      setSearchResultCount(0);
      setCurrentSearchResultIndex(0);
    }
  }, [jsonSearchTerm, data]);
  
  // Function to navigate to next/prev search result
  const navigateSearchResults = useCallback((direction) => {
    if (searchResults.length === 0) return;
    
    let nextIndex;
    if (direction === 'next') {
      nextIndex = (currentSearchResultIndex + 1) % searchResults.length;
    } else {
      nextIndex = (currentSearchResultIndex - 1 + searchResults.length) % searchResults.length;
    }
    
    setCurrentSearchResultIndex(nextIndex);
    
    // Find the path to the search result
    const result = searchResults[nextIndex];
    if (result && result.path) {
      // Expand all parent nodes to make the result visible
      if (jsonViewerRef.current) {
        // Highlight the search result in React JSON View
        // The library doesn't provide direct access to elements, so we'll use a visual queue
        // and a setTimeout to give feedback to the user
        const highlightedElement = jsonViewerRef.current.querySelector('.search-highlight');
        if (highlightedElement) {
          highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Add a temporary pulse effect
          highlightedElement.classList.add('current-highlight');
          setTimeout(() => {
            highlightedElement.classList.remove('current-highlight');
          }, 1000);
        }
      }
    }
  }, [searchResults, currentSearchResultIndex]);
  
  // Add keyboard listener for search
  useEffect(() => {
    if (!showRawJson) return;
    
    const handleKeyDown = (e) => {
      // Ctrl+F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.querySelector('.json-search-input');
        if (searchInput) searchInput.focus();
      }
      
      // F3 or Enter in search box to go to next result
      if (e.key === 'F3' || 
          (e.key === 'Enter' && document.activeElement.classList.contains('json-search-input'))) {
        e.preventDefault();
        navigateSearchResults('next');
      }
      
      // Shift+F3 or Shift+Enter in search box to go to previous result
      if ((e.key === 'F3' && e.shiftKey) || 
          (e.key === 'Enter' && e.shiftKey && document.activeElement.classList.contains('json-search-input'))) {
        e.preventDefault();
        navigateSearchResults('prev');
      }
      
      // Escape to clear search
      if (e.key === 'Escape' && jsonSearchTerm) {
        e.preventDefault();
        setJsonSearchTerm('');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showRawJson, jsonSearchTerm, navigateSearchResults]);

  // Expose methods to parent component through ref
  React.useImperativeHandle(ref, () => ({
    getSelectedColumns: () => selectedColumns,
    getColumnWidths: () => columnWidths,
    getColumnOrder: () => columnOrder
  }));

  // Add getHighlightColor function
  const getHighlightColor = useCallback((value, columnName) => {
    // If showing color highlighting is disabled, return inherit
    if (!showColorHighlighting) return 'inherit';
    
    // Check if the column name indicates coloring
    if (columnName && typeof columnName === 'string') {
      const column = columnName.toLowerCase();
      if (column.includes('_blue')) return 'rgba(0, 0, 255, 0.1)';
      if (column.includes('_red')) return 'rgba(255, 0, 0, 0.1)';
    }
    
    // For backward compatibility, also check values
    if (value && typeof value === 'string') {
      const cellValue = value.toLowerCase();
      if (cellValue.includes('_blue')) return 'rgba(0, 0, 255, 0.1)';
      if (cellValue.includes('_red')) return 'rgba(255, 0, 0, 0.1)';
    }
    
    return 'inherit';
  }, [showColorHighlighting]);

  // Notify parent of state changes, but only when they actually change
  useEffect(() => {
    const currentState = {
      columnVisibility: selectedColumns,
      columnWidths,
      filterColoredText,
      wrapText,
      columnOrder,
      showRawJson,
      jsonDarkTheme,
      jsonSearchTerm
    };

    // Only notify if the state has actually changed
    if (JSON.stringify(currentState) !== JSON.stringify(previousStateRef.current)) {
      previousStateRef.current = currentState;
      if (onStateChange) {
        onStateChange(currentState);
      }
    }
  }, [selectedColumns, columnWidths, filterColoredText, wrapText, columnOrder, showRawJson, jsonDarkTheme, jsonSearchTerm, onStateChange]);

  // Get visible columns in proper order
  const visibleColumns = useMemo(() => {
    // First ensure all keys in the current dataset are in columnOrder
    const currentOrder = [...columnOrder];
    
    // Filter columnOrder to only include columns that exist in the dataset
    const validOrder = currentOrder.filter(key => processedData.keys.includes(key));
    
    // Add any new columns that aren't in the order
    processedData.keys.forEach(key => {
      if (!validOrder.includes(key)) {
        validOrder.push(key);
      }
    });
    
    // Update columnOrder if it changed
    if (JSON.stringify(validOrder) !== JSON.stringify(currentOrder)) {
      console.log('Column order updated to include all available columns in the dataset');
      setColumnOrder(validOrder);
    }
    
    // Ensure selectedColumns contains all current keys
    const currentSelectedColumns = {...selectedColumns};
    let hasChanges = false;
    
    // Add any new columns to selectedColumns
    processedData.keys.forEach(key => {
      if (currentSelectedColumns[key] === undefined) {
        currentSelectedColumns[key] = true; // Default new columns to visible
        hasChanges = true;
      }
    });
    
    // Update selectedColumns if needed
    if (hasChanges) {
      console.log('Updating column visibility to include new columns in the dataset');
      setSelectedColumns(currentSelectedColumns);
    }
    
    // Return only visible columns in the correct order
    return validOrder.filter(key => selectedColumns[key]);
  }, [processedData.keys, selectedColumns, columnOrder]);

  const flattenedRows = useMemo(() => {
    if (!filterColoredText) return processedData.flattenedRows;
    
    // Get visible columns that have _blue or _red in their names
    const colorColumns = visibleColumns.filter(key => 
      key.includes('_blue') || key.includes('_red')
    );
    
    // If no color columns are visible, return all rows
    if (colorColumns.length === 0) return processedData.flattenedRows;
    
    // Filter rows where at least one color column has data
    return processedData.flattenedRows.filter(row => 
      colorColumns.some(key => {
        const value = row[key];
        // Check if the value exists and is not empty
        return value !== null && 
               value !== undefined && 
               value !== '' && 
               value !== '<br>' && 
               value !== '<br/>' &&
               value.trim().length > 0;
      })
    );
  }, [processedData.flattenedRows, visibleColumns, filterColoredText]);

  // Helper function to check if a string is an image URL or base64
  const isImageValue = useCallback((value, key) => {
    if (typeof value !== 'string') return false;
    
    // Check if the column name indicates it's an image
    if (key && (key.toLowerCase().includes('image') || key.toLowerCase().includes('img'))) {
      return true;
    }

    // Check if it's a data URL
    if (value.startsWith('data:image/')) {
      return true;
    }

    // Check for image URLs
    const hasImageExtension = value.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i);
    const isImageUrl = value.startsWith('http') && value.match(/\.(jpg|jpeg|png|gif|bmp|svg|webp)(\?.*)?$/i);
    
    return hasImageExtension || isImageUrl;
  }, []);

  // Function to convert base64 to data URL if needed
  const getImageUrl = useCallback((value) => {
    if (!value || typeof value !== 'string') return '';

    // If it's already a data URL or regular URL, return as is
    if (value.startsWith('data:') || value.startsWith('http')) {
      return value;
    }

    // Try to convert base64 to data URL
    try {
      // Remove any whitespace and newlines from base64 string
      const cleanBase64 = value.replace(/[\s\n\r]/g, '');
      return `data:image/png;base64,${cleanBase64}`;
    } catch (e) {
      console.error('Error converting base64 to data URL:', e);
      return '';
    }
  }, []);

  // Function to format value for display
  const formatValue = (value, key) => {
    if (value === null || value === undefined) return '';
    
    // Check if the value is an image
    if (isImageValue(value, key)) {
      const imageUrl = getImageUrl(value);
      if (!imageUrl) return String(value);

      return (
        <div className="image-cell">
          <img 
            src={imageUrl} 
            alt={`${key} content`} 
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.textContent = 'Invalid image data';
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (e.target.style.display !== 'none') {
                setEnlargedImage({ src: imageUrl, alt: `${key} content` });
              }
            }}
          />
        </div>
      );
    }
    
    // Render HTML content for fields with _html in their name
    if (typeof value === 'string' && (
        key.includes('_html') || 
        key.endsWith('html') || 
        (value.trim().startsWith('<') && value.includes('>'))
      )) {
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: value }} 
          className="html-content"
        />
      );
    }
    
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Toggle column selection
  const toggleColumn = useCallback((column) => {
    setSelectedColumns(prev => {
      const newState = {
        ...prev,
        [column]: !prev[column]
      };
      
      // If we're hiding a column, add it to recently hidden list
      if (prev[column] && !newState[column]) {
        setRecentlyHiddenColumns(recent => {
          // Add to the beginning, limit to 5 recent columns
          const newRecent = [column, ...recent.filter(col => col !== column)].slice(0, 5);
          return newRecent;
        });
      }
      
      return newState;
    });
  }, []);

  // Select/deselect all columns
  const selectAllColumns = useCallback((selected) => {
    setSelectedColumns(
      Object.fromEntries(processedData.keys.map(key => [key, selected]))
    );
  }, [processedData.keys]);

  // Simplified and fixed column resize handler
  const handleResizeStart = useCallback((e, column) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startWidth = columnWidths[column] || 200;
    
    // Add a class to body to ensure proper cursor throughout document
    document.body.classList.add('column-resizing');
    
    const handleMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(100, startWidth + deltaX);
      
      // Update columnWidths state with the new width for this column
      setColumnWidths(prev => ({
        ...prev,
        [column]: newWidth
      }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('column-resizing');
      
      // Notify parent of column width change
      if (onStateChange) {
        onStateChange({
          columnWidths: {
            ...columnWidths,
            [column]: columnWidths[column] || 200
          }
        });
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [columnWidths, onStateChange]);

  // New drag and drop handlers for column reordering
  const handleDragStart = useCallback((e, column) => {
    setDraggedColumn(column);
    e.dataTransfer.effectAllowed = 'move';
    // Add a custom class to change the cursor
    document.body.classList.add('column-dragging');
    // Using a transparent placeholder image for better drag appearance
    const dragImg = document.createElement('img');
    dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    dragImg.width = 0;
    dragImg.height = 0;
    e.dataTransfer.setDragImage(dragImg, 0, 0);
  }, []);

  const handleDragOver = useCallback((e, column) => {
    e.preventDefault();
    if (column !== draggedColumn) {
      setDragOverColumn(column);
    }
  }, [draggedColumn]);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback((e, targetColumn) => {
    e.preventDefault();
    
    if (draggedColumn && targetColumn && draggedColumn !== targetColumn) {
      // Create new column order with dragged column moved to new position
      const newOrder = [...columnOrder];
      const draggedIdx = newOrder.indexOf(draggedColumn);
      const targetIdx = newOrder.indexOf(targetColumn);
      
      // Remove dragged column
      newOrder.splice(draggedIdx, 1);
      // Insert it at target position
      newOrder.splice(targetIdx, 0, draggedColumn);
      
      // Update state
      setColumnOrder(newOrder);
    }
    
    // Reset drag state
    setDraggedColumn(null);
    setDragOverColumn(null);
    document.body.classList.remove('column-dragging');
  }, [draggedColumn, columnOrder]);

  const handleDragEnd = useCallback(() => {
    setDraggedColumn(null);
    setDragOverColumn(null);
    document.body.classList.remove('column-dragging');
  }, []);

  // Expose current display preferences to parent
  useEffect(() => {
    if (window.displayPreferences) {
      window.displayPreferences.current = {
        selectedColumns,
        columnWidths,
        columnOrder
      };
    }
  }, [selectedColumns, columnWidths, columnOrder]);

  // Filter columns based on search term
  const filteredKeys = useMemo(() => 
    searchTerm 
      ? processedData.keys.filter(key => 
          key.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : processedData.keys,
    [processedData.keys, searchTerm]
  );

  // Early return moved here after all hooks
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }
  
  // Also return early if there's no section code - this prevents showing data during transitions
  if (!sectionCode) {
    return <div>No section code provided. Please select a section.</div>;
  }

  // Update the column count display
  const columnCountDisplay = `(${visibleColumns.length}/${processedData.keys.length})`;

  return (
    <div className="flat-data-table-wrapper" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div className="table-controls">
        <div className="left-controls">
          <h3>{title || 'Flat Data View'} ({flattenedRows.length} rows)</h3>
          {showColorHighlighting && (
            <label className="color-filter">
              <input
                type="checkbox"
                checked={filterColoredText}
                onChange={() => setFilterColoredText(!filterColoredText)}
              />
              Only show rows with red/blue text
            </label>
          )}
          {allowTextWrapping && (
            <label>
              <input
                type="checkbox"
                checked={wrapText}
                onChange={() => setWrapText(!wrapText)}
              />
              Wrap text in cells
            </label>
          )}
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowRawJson(!showRawJson)}
            title="Toggle between table view and raw JSON view"
          >
            {showRawJson ? 'Show Table View' : 'Show Raw JSON'}
          </button>
        </div>
        {showColumnSelection && !showRawJson && (
          <div className="column-selector-container">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => setShowColumnSelector(!showColumnSelector)}
            >
              {showColumnSelector ? 'Hide Column Selector' : 'Show Column Selector'}
            </button>
            <span className="column-count">
              {columnCountDisplay}
            </span>
          </div>
        )}
      </div>
      
      {showColumnSelector && !showRawJson && (
        <div className="column-selector-modal-overlay">
          <div className="column-selector-modal">
            <div className="column-selector-header">
              <h3>Select Columns to Display</h3>
              <input
                type="text"
                placeholder="Search columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="column-search"
              />
              <div className="column-selector-actions">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => selectAllColumns(true)}
                >
                  Select All
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => selectAllColumns(false)}
                >
                  Deselect All
                </button>
                <button
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => setShowColumnSelector(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div className="column-list">
              {filteredKeys.map(key => (
                <div key={key} className="column-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={!!selectedColumns[key]}
                      onChange={() => toggleColumn(key)}
                    />
                    {key}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Recently hidden columns bar */}
      {recentlyHiddenColumns.length > 0 && !showRawJson && (
        <div className="recently-hidden-columns">
          <span className="recently-hidden-label">Recently hidden:</span>
          {recentlyHiddenColumns.map(column => (
            <button
              key={column}
              className="btn btn-sm btn-outline-secondary restore-column-btn"
              onClick={() => {
                toggleColumn(column);
                setRecentlyHiddenColumns(prev => prev.filter(col => col !== column));
              }}
              title={`Restore column: ${column}`}
            >
              {column} <span className="restore-icon">+</span>
            </button>
          ))}
          <button
            className="btn btn-sm btn-outline-danger clear-recent"
            onClick={() => setRecentlyHiddenColumns([])}
            title="Clear recently hidden columns list"
          >
            Clear
          </button>
        </div>
      )}
      
      {showRawJson ? (
        <div className="raw-json-container" data-theme={jsonDarkTheme ? 'dark' : 'light'}>
          <div className="json-controls">
            <div className="json-search">
              <input
                type="text"
                placeholder="Search in JSON... (Ctrl+F)"
                value={jsonSearchTerm}
                onChange={(e) => setJsonSearchTerm(e.target.value)}
                className="json-search-input"
              />
              {jsonSearchTerm && (
                <button
                  className="btn btn-sm btn-outline-secondary clear-search"
                  onClick={() => setJsonSearchTerm('')}
                >
                  ✕
                </button>
              )}
              {searchResultCount > 0 && (
                <>
                  <span className="search-count">
                    {currentSearchResultIndex + 1} of {searchResultCount} matches
                  </span>
                  <div className="search-navigation">
                    <button 
                      className="btn btn-sm btn-outline-secondary nav-btn"
                      onClick={() => navigateSearchResults('prev')}
                      title="Previous match (Shift+F3)"
                    >
                      ↑
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-secondary nav-btn"
                      onClick={() => navigateSearchResults('next')}
                      title="Next match (F3)"
                    >
                      ↓
                    </button>
                  </div>
                </>
              )}
            </div>
            <div className="json-view-actions">
              <button
                className="btn btn-sm btn-outline-secondary mr-2"
                onClick={() => setJsonExpanded(!jsonExpanded)}
                title={jsonExpanded ? "Collapse All" : "Expand All"}
              >
                {jsonExpanded ? "Collapse All" : "Expand All"}
              </button>
              <button
                className={`btn btn-sm ${jsonDarkTheme ? 'btn-light' : 'btn-dark'}`}
                onClick={() => setJsonDarkTheme(!jsonDarkTheme)}
                title={jsonDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                {jsonDarkTheme ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
          
          <div className="json-viewer-wrapper" ref={jsonViewerRef}>
            <CustomJsonView 
              data={data} 
              searchTerm={jsonSearchTerm}
              searchResults={searchResults}
              enableClipboard={false}
              enableCollapse={true}
              collapseStringsAfterLength={100}
              displayDataTypes={false}
              displayObjectSize={true}
              indentWidth={2}
              collapsed={!jsonExpanded}
            />
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {visibleColumns
                  .filter((column) => selectedColumns[column])
                  .map((column) => (
                  <th 
                    key={column}
                    style={{ 
                      width: columnWidths[column] ? `${columnWidths[column]}px` : '200px',
                      backgroundColor: draggedColumn === column ? '#e0e0e0' : 
                                      dragOverColumn === column ? '#f0f7ff' : '#f5f5f5',
                      cursor: 'grab',
                      borderLeft: dragOverColumn === column ? '2px solid #2196F3' : '1px solid #ddd',
                      position: 'relative'
                    }}
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, column)}
                    onDragOver={(e) => handleDragOver(e, column)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column)}
                    onDragEnd={handleDragEnd}
                  >
                    <div className="header-content">
                      <div className="drag-handle" title="Drag to reorder column">::</div>
                      {column}
                      <button 
                        className="hide-column-btn" 
                        title="Hide this column"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleColumn(column);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <div 
                      className="resize-handle"
                      onMouseDown={(e) => handleResizeStart(e, column)}
                      title="Drag to resize column"
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flattenedRows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {visibleColumns
                    .filter((column) => selectedColumns[column])
                    .map((column) => (
                      <td
                        key={column}
                        style={{
                          width: columnWidths[column] ? `${columnWidths[column]}px` : '200px',
                          whiteSpace: wrapText ? 'normal' : 'nowrap',
                          backgroundColor: getHighlightColor(row[column], column),
                          overflow: 'hidden'
                        }}
                        className={isImageValue(row[column], column) ? 'image-cell' : ''}
                      >
                        {formatValue(row[column], column)}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {enlargedImage && (
        <ImageModal 
          src={enlargedImage.src}
          alt={enlargedImage.alt}
          onClose={() => setEnlargedImage(null)}
        />
      )}
    </div>
  );
});

FlatDataTable.propTypes = {
  data: PropTypes.array.isRequired,
  sectionCode: PropTypes.string,
  initialColumnVisibility: PropTypes.object,
  initialColumnWidths: PropTypes.object,
  initialColumnOrder: PropTypes.array,
  onStateChange: PropTypes.func,
  showColumnSelection: PropTypes.bool,
  allowTextWrapping: PropTypes.bool,
  showColorHighlighting: PropTypes.bool,
  title: PropTypes.string,
  componentId: PropTypes.string
};