import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { flattenNestedData } from '../utils/dataUtils';
import PropTypes from 'prop-types';

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
  onStateChange,
  showColumnSelection = true,
  allowTextWrapping = true,
  showColorHighlighting = true,
  title
}, ref) => {
  const [selectedColumns, setSelectedColumns] = useState({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterColoredText, setFilterColoredText] = useState(false);
  const [wrapText, setWrapText] = useState(false);
  const [columnWidths, setColumnWidths] = useState({});
  const [enlargedImage, setEnlargedImage] = useState(null);
  const isInitialized = useRef(false);
  const previousStateRef = useRef(null);

  // Expose methods to parent component through ref
  React.useImperativeHandle(ref, () => ({
    getSelectedColumns: () => selectedColumns,
    getColumnWidths: () => columnWidths
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

  // Load display preferences when section code changes
  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      if (!sectionCode) return;

      try {
        console.log('Loading preferences for section:', sectionCode);
        const response = await fetch(`http://localhost:3001/api/display-preferences/${encodeURIComponent(sectionCode)}`);
        
        if (!isMounted) return;

        if (response.ok) {
          const prefs = await response.json();
          console.log('Loaded preferences:', prefs);
          if (prefs.selectedColumns) {
            setSelectedColumns(prefs.selectedColumns);
          }
          if (prefs.columnWidths) {
            setColumnWidths(prefs.columnWidths);
          }
        } else {
          console.log('No saved preferences found for section:', sectionCode);
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error loading display preferences:', error);
      }
    };

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, [sectionCode]);

  // Initialize selected columns if no preferences were loaded
  useEffect(() => {
    if (!isInitialized.current && processedData.keys.length > 0) {
      const initialSelection = Object.keys(initialColumnVisibility).length > 0
        ? initialColumnVisibility
        : Object.fromEntries(processedData.keys.map(key => [key, true]));
      
      setSelectedColumns(initialSelection);
      isInitialized.current = true;
    }
  }, [processedData.keys, initialColumnVisibility]);

  // Update state when initialColumnVisibility changes
  useEffect(() => {
    if (Object.keys(initialColumnVisibility).length > 0) {
      setSelectedColumns(initialColumnVisibility);
    }
  }, [initialColumnVisibility]);

  // Notify parent of state changes, but only when they actually change
  useEffect(() => {
    const currentState = {
      columnVisibility: selectedColumns,
      columnWidths,
      filterColoredText,
      wrapText,
    };

    // Only notify if the state has actually changed
    if (JSON.stringify(currentState) !== JSON.stringify(previousStateRef.current)) {
      previousStateRef.current = currentState;
      if (onStateChange) {
        onStateChange(currentState);
      }
    }
  }, [selectedColumns, columnWidths, filterColoredText, wrapText, onStateChange]);

  const visibleColumns = useMemo(() => 
    processedData.keys.filter(key => selectedColumns[key]),
    [processedData.keys, selectedColumns]
  );

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

  // Handle column resize with debounce
  const handleResizeStart = useCallback((e, column) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const headerCell = e.target.closest('th');
    const startWidth = headerCell.offsetWidth;
    
    const handleMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      const newWidth = Math.max(100, startWidth + (moveEvent.clientX - startX));
      setColumnWidths(prev => ({
        ...prev,
        [column]: newWidth
      }));
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Expose current display preferences to parent
  useEffect(() => {
    if (window.displayPreferences) {
      window.displayPreferences.current = {
        selectedColumns,
        columnWidths
      };
    }
  }, [selectedColumns, columnWidths]);

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

  // Update the column count display
  const columnCountDisplay = `(${visibleColumns.length}/${processedData.keys.length})`;

  return (
    <div className="flat-data-table-wrapper" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      position: 'relative',
      overflow: 'hidden' // Changed from overflow-x: visible to prevent overflow conflicts
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
        </div>
        {showColumnSelection && (
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
      
      {showColumnSelector && (
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
      
      <div className="table-container" style={{
        flex: '1 1 auto',
        overflow: 'auto !important',
        position: 'relative',
        width: '100%',
        minWidth: '100%', // Changed from min-width: 0
        height: '100%',
        minHeight: '0',
      }}>
        <table 
          className="data-table"
          style={{ 
            tableLayout: 'auto',
            width: 'auto',
            minWidth: 'max-content' // Ensures table expands to fit all columns
          }}
        >
          <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
            <tr>
              {visibleColumns
                .filter((column) => selectedColumns[column])
                .map((column) => (
                <th 
                    key={column}
                  style={{ 
                      width: columnWidths[column] ? `${columnWidths[column]}px` : '200px',
                      minWidth: columnWidths[column] ? `${columnWidths[column]}px` : '200px'
                  }}
                >
                    <div className="header-content">
                      {column}
                  <div 
                        className="resize-handle"
                        onMouseDown={(e) => handleResizeStart(e, column)}
                  />
                    </div>
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
                        minWidth: columnWidths[column] ? `${columnWidths[column]}px` : '200px',
                        whiteSpace: wrapText ? 'normal' : 'nowrap',
                        backgroundColor: getHighlightColor(row[column], column),
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
  onStateChange: PropTypes.func,
  showColumnSelection: PropTypes.bool,
  allowTextWrapping: PropTypes.bool,
  showColorHighlighting: PropTypes.bool,
  title: PropTypes.string
};