import React, { useState, useMemo, useEffect, useRef } from 'react';
import { flattenNestedData } from '../utils/dataUtils';
import PropTypes from 'prop-types';

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
  const isInitialized = useRef(false);

  // Expose methods through ref
  React.useImperativeHandle(ref, () => ({
    getSelectedColumns: () => {
      console.log('Getting selected columns:', selectedColumns);
      return selectedColumns;
    },
    getColumnWidths: () => {
      console.log('Getting column widths:', columnWidths);
      return columnWidths;
    }
  }), [selectedColumns, columnWidths]);

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
      if (Object.keys(initialColumnVisibility).length > 0) {
        setSelectedColumns(initialColumnVisibility);
      } else {
        const initialSelection = Object.fromEntries(
          processedData.keys.map(key => [key, true])
        );
        setSelectedColumns(initialSelection);
      }
      isInitialized.current = true;
    }
  }, [processedData.keys, initialColumnVisibility]);

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

  // Filter columns based on search term
  const filteredKeys = useMemo(() => 
    searchTerm 
      ? processedData.keys.filter(key => 
          key.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : processedData.keys,
    [processedData.keys, searchTerm]
  );

  // Function to format value for display
  const formatValue = (value, key) => {
    if (value === null || value === undefined) return '';
    
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
  const toggleColumn = (column) => {
    setSelectedColumns(prev => {
      const newState = {
        ...prev,
        [column]: !prev[column]
      };
      return newState;
    });
  };

  // Select/deselect all columns
  const selectAllColumns = (selected) => {
    const newSelection = {};
    processedData.keys.forEach(key => {
      newSelection[key] = selected;
    });
    setSelectedColumns(newSelection);
  };

  // Handle column resize
  const handleResizeStart = (e, column) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const headerCell = e.target.parentElement;
    const startWidth = headerCell.offsetWidth;
    
    const handleMouseMove = (moveEvent) => {
      moveEvent.preventDefault();
      const newWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
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
  };

  // Expose current display preferences to parent
  useEffect(() => {
    if (window.displayPreferences) {
      window.displayPreferences.current = {
        selectedColumns,
        columnWidths
      };
    }
  }, [selectedColumns, columnWidths]);

  // Add this after other useEffect hooks
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        columnVisibility: selectedColumns,
        columnWidths,
        filterColoredText,
        wrapText,
        searchTerm
      });
    }
  }, [selectedColumns, columnWidths, filterColoredText, wrapText, searchTerm, onStateChange]);

  // Helper function to determine column background class
  const getColumnClassName = (columnName, isWrapped) => {
    const classes = [columnName];
    if (isWrapped) {
      classes.push('wrap-text');
    } else {
      classes.push('no-wrap');
    }
    return classes.join(' ');
  };

  // Early return moved here after all hooks
  if (!data || data.length === 0) {
    return <div>No data available</div>;
  }

  // Update the column count display
  const columnCountDisplay = `(${visibleColumns.length}/${processedData.keys.length})`;

  return (
    <div className="flat-table-view">
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
          <div className="column-controls">
            <button 
              className="column-selector-button"
              onClick={() => setShowColumnSelector(!showColumnSelector)}
            >
              {showColumnSelector ? 'Hide Columns' : 'Select Columns'}
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
                <button onClick={() => selectAllColumns(true)}>Select All</button>
                <button onClick={() => selectAllColumns(false)}>Deselect All</button>
                <button 
                  className="close-button"
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
      
      <div className="table-container">
        <table className="data-table compact">
          <thead>
            <tr>
              {visibleColumns.map(key => (
                <th 
                  key={key} 
                  title={key}
                  style={{ 
                    width: columnWidths[key] ? `${columnWidths[key]}px` : '150px'
                  }}
                >
                  {key.split('.').pop()}
                  <div 
                    className="resizer"
                    onMouseDown={(e) => handleResizeStart(e, key)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flattenedRows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {visibleColumns.map(key => (
                  <td 
                    key={key}
                    className={getColumnClassName(key, wrapText)}
                    style={{ 
                      width: columnWidths[key] ? `${columnWidths[key]}px` : '150px',
                      maxWidth: columnWidths[key] ? `${columnWidths[key]}px` : '150px'
                    }}
                  >
                    {formatValue(row[key], key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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