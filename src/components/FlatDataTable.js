import React, { useState, useMemo, useEffect, useRef, useCallback, useImperativeHandle } from 'react';
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
  initialLockedColumns = [],
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
  const [lockedColumns, setLockedColumns] = useState(initialLockedColumns);
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const jsonViewerRef = useRef(null);
  const isInitialized = useRef(false);
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
      setLockedColumns([]);
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

    // Initialize locked columns from saved preferences
    if (initialLockedColumns && initialLockedColumns.length > 0) {
      console.log('Initializing locked columns from preferences:', initialLockedColumns);
      // Filter out any locked columns that don't exist in the current dataset
      const validLockedColumns = initialLockedColumns.filter(col => 
        processedData.keys.includes(col)
      );
      console.log('Valid locked columns after filtering:', validLockedColumns);
      setLockedColumns(validLockedColumns);
    } else {
      console.log('No locked columns in preferences, initializing empty array');
      setLockedColumns([]);
    }
    
    console.log('Initialized component with', {
      columns: processedData.keys.length,
      lockedColumns: initialLockedColumns?.length || 0,
      validLockedColumns: lockedColumns.length
    });
    
    preferenceLoadedRef.current = true;
    isInitialized.current = true;
  }, [processedData.keys, initialColumnVisibility, initialColumnWidths, initialColumnOrder, initialLockedColumns, lockedColumns.length]);

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
    
    const applyFixedHeaders = () => {
      if (stickyStyleRef.current) {
        stickyStyleRef.current.remove();
        stickyStyleRef.current = null;
      }

      // Get the actual widths of columns from the DOM
      const getColumnWidth = (column) => {
        const headerCell = document.querySelector(`.data-table th[data-column="${column}"]`);
        if (headerCell) {
          return headerCell.offsetWidth;
        }
        return columnWidths[column] || 200; // Fallback to state or default
      };
      
      // Calculate cumulative widths for locked columns
      const cumulativeWidths = {};
      let totalWidth = 0;
      lockedColumns.forEach((col) => {
        cumulativeWidths[col] = totalWidth;
        totalWidth += getColumnWidth(col);
      });

      const style = document.createElement('style');
      style.id = `sticky-headers-${componentId}`;
      
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
          position: relative !important;
        }

        /* Make thead sticky */
        .data-table thead {
          position: -webkit-sticky !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 2 !important;
          background-color: #f5f5f5 !important;
        }

        /* Make th cells sticky */
        .data-table th {
          position: -webkit-sticky !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 2 !important;
          background-color: #f5f5f5 !important;
        }

        /* Locked columns styles */
        ${lockedColumns.map((col, index) => `
          .data-table td[data-column="${col}"],
          .data-table th[data-column="${col}"] {
            position: sticky !important;
            left: ${cumulativeWidths[col]}px !important;
            background-color: inherit !important;
          }
          
          .data-table td[data-column="${col}"] {
            z-index: 1 !important;
            background-color: inherit !important;
          }
          
          .data-table th[data-column="${col}"] {
            z-index: 3 !important;
            background-color: #f5f5f5 !important;
          }

          /* Add shadow only to the last locked column */
          ${index === lockedColumns.length - 1 ? `
            .data-table td[data-column="${col}"],
            .data-table th[data-column="${col}"] {
              box-shadow: 2px 0 3px rgba(0,0,0,0.1) !important;
            }
          ` : ''}

          /* Ensure proper background for locked cells */
          .data-table tr:nth-child(even) td[data-column="${col}"] {
            background-color: #ffffff !important;
          }
          
          .data-table tr:nth-child(odd) td[data-column="${col}"] {
            background-color: #f9f9f9 !important;
          }
        `).join('\n')}

        /* Add transition for smooth column locking */
        .data-table td,
        .data-table th {
          transition: left 0.2s ease-out !important;
        }

        /* Ensure header content is visible */
        .data-table th .header-content {
          position: relative !important;
          z-index: 1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
        }

        /* Lock controls styles */
        .lock-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-left: 10px;
        }

        .lock-btn {
          padding: 2px 6px;
          font-size: 12px;
          border: 1px solid #ddd;
          border-radius: 3px;
          background: #fff;
          cursor: pointer;
          opacity: 0.7;
          z-index: 4 !important;
          transition: all 0.2s ease !important;
        }

        .lock-btn:hover {
          opacity: 1;
          background: #f0f7ff;
        }

        .lock-btn.locked {
          background: #e3f2fd;
          border-color: #2196f3;
          color: #1976d2;
          opacity: 1;
        }

        /* Make sure resize handles stay above content */
        .resize-handle {
          position: absolute !important;
          z-index: 4 !important;
        }

        /* Fix for Firefox */
        @-moz-document url-prefix() {
          .data-table thead,
          .data-table th {
            position: sticky !important;
          }
        }
      `;
      
      document.head.appendChild(style);
      stickyStyleRef.current = style;
      
      return style;
    };
    
    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(applyFixedHeaders, 0);
    
    return () => {
      clearTimeout(timeoutId);
      if (stickyStyleRef.current && stickyStyleRef.current.parentNode) {
        stickyStyleRef.current.parentNode.removeChild(stickyStyleRef.current);
      }
      stickyStyleRef.current = null;
    };
  }, [processedData.flattenedRows, componentId, lockedColumns, columnWidths]);

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

  // Expose current display preferences to parent
  useEffect(() => {
    if (window.displayPreferences) {
      window.displayPreferences.current = {
        selectedColumns,
        columnWidths,
        columnOrder,
        lockedColumns
      };
    }
  }, [selectedColumns, columnWidths, columnOrder, lockedColumns]);

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    getSelectedColumns: () => selectedColumns,
    getColumnWidths: () => columnWidths,
    getColumnOrder: () => columnOrder,
    getLockedColumns: () => lockedColumns
  }));

  // Add getHighlightColor function
  const getHighlightColor = useCallback((value, columnName, rowIndex) => {
    // If showing color highlighting is enabled (for tab 5), handle red/blue highlighting
    if (showColorHighlighting) {
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
    }
    
    // For tab 4 (parsed JSONs), implement alternate row coloring
    return rowIndex % 2 === 0 ? '#ffffff' : '#f9f9f9';
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
      jsonSearchTerm,
      lockedColumns
    };

    // Only notify if the state has actually changed
    if (JSON.stringify(currentState) !== JSON.stringify(previousStateRef.current)) {
      previousStateRef.current = currentState;
      if (onStateChange) {
        onStateChange(currentState);
      }
    }
  }, [selectedColumns, columnWidths, filterColoredText, wrapText, columnOrder, 
      showRawJson, jsonDarkTheme, jsonSearchTerm, lockedColumns, onStateChange]);

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

  // Add this after the flattenedRows useMemo
  const filteredRows = useMemo(() => {
    if (!tableSearchTerm) return flattenedRows;
    
    const searchLower = tableSearchTerm.toLowerCase();
    return flattenedRows.filter(row => 
      visibleColumns.some(column => {
        const value = row[column];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchLower);
      })
    );
  }, [flattenedRows, visibleColumns, tableSearchTerm]);

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

  // Filter columns based on search term
  const filteredKeys = useMemo(() => 
    searchTerm 
      ? processedData.keys.filter(key => 
          key.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : processedData.keys,
    [processedData.keys, searchTerm]
  );

  // Add new function to handle column locking
  const toggleColumnLock = useCallback((column) => {
    setLockedColumns(prev => {
      if (prev.includes(column)) {
        // Remove from locked columns
        return prev.filter(col => col !== column);
      } else {
        // Add to locked columns, maintaining order
        const newLocked = [...prev];
        const columnIndex = visibleColumns.indexOf(column);
        const insertIndex = newLocked.findIndex(col => visibleColumns.indexOf(col) > columnIndex);
        if (insertIndex === -1) {
          newLocked.push(column);
        } else {
          newLocked.splice(insertIndex, 0, column);
        }
        return newLocked;
      }
    });
  }, [visibleColumns]);

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

  // Modify the table header rendering to include lock controls
  const renderTableHeader = () => (
    <thead>
      <tr>
        {visibleColumns
          .filter((column) => selectedColumns[column])
          .map((column) => (
            <th 
              key={column}
              data-column={column}
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
                <div className="lock-controls">
                  <button 
                    className={`lock-btn ${lockedColumns.includes(column) ? 'locked' : ''}`}
                    title={lockedColumns.includes(column) ? "Unlock column" : "Lock column"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleColumnLock(column);
                    }}
                  >
                    {lockedColumns.includes(column) ? '🔒' : '🔓'}
                  </button>
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
  );

  // Modify the table body rendering to use filteredRows instead of flattenedRows
  const renderTableBody = () => (
    <tbody>
      {filteredRows.map((row, rowIndex) => (
        <tr key={rowIndex}>
          {visibleColumns
            .filter((column) => selectedColumns[column])
            .map((column) => (
              <td
                key={column}
                data-column={column}
                style={{
                  width: columnWidths[column] ? `${columnWidths[column]}px` : '200px',
                  whiteSpace: wrapText ? 'normal' : 'nowrap',
                  backgroundColor: getHighlightColor(row[column], column, rowIndex),
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
  );

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
          <h3>{title || 'Flat Data View'} ({filteredRows.length} rows)</h3>
          <div className="table-search">
            <input
              type="text"
              placeholder="Search in visible columns..."
              value={tableSearchTerm}
              onChange={(e) => setTableSearchTerm(e.target.value)}
              className="table-search-input"
            />
            {tableSearchTerm && (
              <button
                className="btn btn-sm btn-outline-secondary clear-search"
                onClick={() => setTableSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>
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
            {renderTableHeader()}
            {renderTableBody()}
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
  initialLockedColumns: PropTypes.array,
  onStateChange: PropTypes.func,
  showColumnSelection: PropTypes.bool,
  allowTextWrapping: PropTypes.bool,
  showColorHighlighting: PropTypes.bool,
  title: PropTypes.string,
  componentId: PropTypes.string
};