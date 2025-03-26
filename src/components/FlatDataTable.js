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
  const isInitialized = useRef(false);
  const previousStateRef = useRef(null);
  const previousSectionCode = useRef(sectionCode);
  const mountedRef = useRef(false);
  const preferenceLoadedRef = useRef(false);
  
  // New state for column ordering
  const [columnOrder, setColumnOrder] = useState(initialColumnOrder.length > 0 ? initialColumnOrder : []);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

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
      
      // Reset initialized flag to trigger reinitialization
      isInitialized.current = false;
      preferenceLoadedRef.current = false;
      
      // Update the reference
      previousSectionCode.current = sectionCode;
    }
  }, [sectionCode]);

  // Process data and get keys
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

  // Move initializeWithDefaults before loadPreferences to avoid circular dependency
  const initializeWithDefaults = useCallback(() => {
    if (!processedData.keys.length) return;
    
    console.log('Initializing with defaults');
    
    // Use initialColumnVisibility if provided, otherwise set all columns visible
    const initVisibility = Object.keys(initialColumnVisibility).length > 0
      ? { ...initialColumnVisibility }
      : Object.fromEntries(processedData.keys.map(key => [key, true]));
    
    // Filter to only include valid columns
    const validVisibility = {};
    processedData.keys.forEach(key => {
      validVisibility[key] = initVisibility[key] !== undefined ? initVisibility[key] : true;
    });
    
    // Set column visibility
    setSelectedColumns(validVisibility);
    
    // Use initialColumnWidths if provided
    if (Object.keys(initialColumnWidths).length > 0) {
      const validWidths = {};
      Object.keys(initialColumnWidths).forEach(key => {
        if (processedData.keys.includes(key)) {
          validWidths[key] = initialColumnWidths[key];
        }
      });
      setColumnWidths(validWidths);
    }
    
    // Use initialColumnOrder if provided, otherwise use keys order
    if (initialColumnOrder.length > 0) {
      const validOrder = initialColumnOrder.filter(col => 
        processedData.keys.includes(col)
      );
      
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
    
    preferenceLoadedRef.current = true;
    isInitialized.current = true;
  }, [processedData.keys, initialColumnVisibility, initialColumnWidths, initialColumnOrder]);

  // Define loadPreferences after initializeWithDefaults
  const loadPreferences = useCallback(async () => {
    if (!sectionCode || !processedData.keys.length) {
      console.log('Skipping preference load - missing section code or data keys');
      return;
    }

    // Don't load preferences more than once for the same section code and data
    if (preferenceLoadedRef.current) {
      console.log('Preferences already loaded for this section code and data');
      return;
    }

    console.log('Loading preferences for section:', sectionCode);
    try {
      // Create query params matching the format used in TabContent.js
      const params = new URLSearchParams({
        sectionCode,
        tabType: componentId.includes('enhanced') ? 'enhanced' : 'parsed'
      });

      // Use the correct endpoint format with query parameters
      const response = await fetch(`http://localhost:3001/api/display-preferences?${params}`);

      if (response.ok) {
        const prefs = await response.json();
        console.log('Loaded preferences:', prefs);
        
        if (Object.keys(prefs).length > 0) {
          // Apply column visibility
          if (prefs.selectedColumns) {
            const columnsForCurrentData = {};
            Object.keys(prefs.selectedColumns).forEach(key => {
              if (processedData.keys.includes(key)) {
                columnsForCurrentData[key] = prefs.selectedColumns[key];
              }
            });
            setSelectedColumns(columnsForCurrentData);
          }
          
          // Apply column widths
          if (prefs.columnWidths) {
            const widthsForCurrentData = {};
            Object.keys(prefs.columnWidths).forEach(key => {
              if (processedData.keys.includes(key)) {
                widthsForCurrentData[key] = prefs.columnWidths[key];
              }
            });
            setColumnWidths(widthsForCurrentData);
          }
          
          // Apply column order
          if (prefs.columnOrder && prefs.columnOrder.length > 0) {
            const validOrder = prefs.columnOrder.filter(col => 
              processedData.keys.includes(col)
            );
            
            const newOrder = [...validOrder];
            processedData.keys.forEach(key => {
              if (!newOrder.includes(key)) {
                newOrder.push(key);
              }
            });
            
            setColumnOrder(newOrder);
          }
          
          preferenceLoadedRef.current = true;
          isInitialized.current = true;
          return;
        }
      }
      
      // If no preferences found or response not ok, initialize with defaults
      console.log('No saved preferences found or error. Initializing with defaults.');
      initializeWithDefaults();
      
    } catch (error) {
      console.error('Error loading preferences:', error);
      initializeWithDefaults();
    }
  }, [sectionCode, processedData.keys, initializeWithDefaults, componentId]);

  // Main initialization effect
  useEffect(() => {
    if (!isInitialized.current && processedData.keys.length > 0 && sectionCode) {
      console.log('Data is available, triggering initialization');
      loadPreferences();
    }
  }, [sectionCode, processedData.keys, loadPreferences]);

  // Detect data changes
  useEffect(() => {
    // Only log if data changed from something to something else (both non-empty)
    if (data && data.length > 0) {
      console.log(`Data updated for FlatDataTable ${componentId}, rows:`, data.length);
      
      // Reset initialization flags when data changes
      if (isInitialized.current) {
        console.log('Data changed after initialization, resetting preference flags');
        preferenceLoadedRef.current = false;
        
        // Don't reset isInitialized here to avoid flickering
        // But do trigger loadPreferences again to ensure we're showing the right columns
        if (sectionCode && processedData.keys.length > 0) {
          loadPreferences();
        }
      }
    }
  }, [data, componentId, sectionCode, processedData.keys, loadPreferences]);

  // Handle JSON search
  useEffect(() => {
    if (jsonSearchTerm.trim() && data) {
      const results = searchJsonForText(data, jsonSearchTerm);
      setSearchResults(results);
      setSearchResultCount(results.length);
    } else {
      setSearchResults([]);
      setSearchResultCount(0);
    }
  }, [jsonSearchTerm, data]);

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
      setColumnOrder(validOrder);
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
    setSelectedColumns(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
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
      
      {showRawJson ? (
        <div className="raw-json-container" data-theme={jsonDarkTheme ? 'dark' : 'light'}>
          <div className="json-controls">
            <div className="json-search">
              <input
                type="text"
                placeholder="Search in JSON..."
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
                <span className="search-count">{searchResultCount} matches</span>
              )}
            </div>
            <button
              className={`btn btn-sm ${jsonDarkTheme ? 'btn-light' : 'btn-dark'}`}
              onClick={() => setJsonDarkTheme(!jsonDarkTheme)}
              title={jsonDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {jsonDarkTheme ? '☀️' : '🌙'}
            </button>
          </div>
          
          <CustomJsonView 
            data={data} 
            searchTerm={jsonSearchTerm}
            searchResults={searchResults}
          />
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