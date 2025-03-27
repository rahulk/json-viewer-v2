import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { FlatDataTable } from './FlatDataTable';
import { JsonFileSelector } from './common/JsonFileSelector';
import { EmptyDataView } from './EmptyDataView';
import { useFileSelector } from '../hooks/useFileSelector';
import { useJsonProcessor } from '../hooks/useJsonProcessor';
import { usePreferences } from '../hooks/usePreferences';

/**
 * Component for displaying a data table tab with file selection
 * @param {Object} props - Component props
 * @param {string} props.tabType - Type of tab ('parsed' or 'enhanced')
 * @param {Array} props.jsonFiles - Available JSON files
 * @param {Object} props.tabState - Current tab state
 * @param {Function} props.handleTabStateChange - Function to update tab state
 * @param {string} props.folderPath - Path to the folder containing JSON files
 * @param {string} props.pdfFilename - Name of the current PDF
 * @param {Function} props.processFiles - Function to load sample files
 * @param {boolean} props.showColorHighlighting - Whether to show color highlighting
 */
export const DataTableTab = ({
  tabType,
  jsonFiles,
  tabState,
  handleTabStateChange,
  folderPath,
  pdfFilename,
  processFiles,
  showColorHighlighting = false
}) => {
  // References and memoized values
  const tableRef = useRef(null);
  const tableKey = useMemo(() => `${tabType}-fixed-instance`, [tabType]);
  const lastProcessedFileRef = useRef(null);
  
  // Custom hooks
  const { saveDisplayPreferences, loadDisplayPreferences } = usePreferences(pdfFilename);
  const { selectedFile, handleFileSelect, sectionCode } = useFileSelector(handleTabStateChange);
  const { isLoading, processJsonFile } = useJsonProcessor(folderPath, loadDisplayPreferences);
  
  // Handle changes in folder path or PDF filename to reset process tracking
  useEffect(() => {
    lastProcessedFileRef.current = null;
  }, [folderPath, pdfFilename]);
  
  // Handler for processing the selected file
  const handleProcessFile = useCallback(() => {
    if (!selectedFile || selectedFile === lastProcessedFileRef.current) {
      console.log('No file selected or already processed this file, ignoring');
      return;
    }
    
    lastProcessedFileRef.current = selectedFile;
    processJsonFile(tabType, selectedFile, handleTabStateChange);
  }, [selectedFile, lastProcessedFileRef, processJsonFile, tabType, handleTabStateChange]);
  
  // Handler for saving display preferences
  const handleSavePreferences = useCallback(() => {
    if (!sectionCode) {
      console.log('No section code available, cannot save preferences');
      return;
    }
    saveDisplayPreferences(tabType, tableRef, sectionCode);
  }, [sectionCode, saveDisplayPreferences, tabType, tableRef]);

  // Memoize the FlatDataTable component to preserve it across renders
  const dataTable = useMemo(() => (
    <FlatDataTable 
      ref={tableRef}
      key={tableKey}
      componentId={`${tabType}-table`}
      data={tabState.data}
      sectionCode={sectionCode}
      showColumnSelection={true}
      allowTextWrapping={true}
      showColorHighlighting={showColorHighlighting}
      initialColumnVisibility={tabState.columnVisibility}
      initialColumnWidths={tabState.columnWidths}
      initialColumnOrder={tabState.columnOrder}
      onStateChange={handleTabStateChange}
      title=""
    />
  ), [
    tableKey, 
    tabState.data, 
    tabState.columnVisibility, 
    tabState.columnWidths, 
    tabState.columnOrder, 
    handleTabStateChange, 
    showColorHighlighting,
    sectionCode,
    tabType
  ]);

  // Create stable props for child components
  const jsonFileSelectorProps = useMemo(() => ({
    jsonFiles,
    selectedFile,
    onFileSelect: handleFileSelect,
    isLoading,
    onProcessFile: handleProcessFile
  }), [jsonFiles, selectedFile, handleFileSelect, isLoading, handleProcessFile]);

  const emptyDataViewProps = useMemo(() => ({
    title: `No ${tabType === 'enhanced' ? 'Enhanced ' : ''}Data Loaded`,
    sectionCode,
    isLoading,
    onLoadData: handleProcessFile,
    onLoadSampleData: processFiles
  }), [tabType, sectionCode, isLoading, handleProcessFile, processFiles]);
  
  return (
    <div style={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'visible'
    }}>
      <div style={{ 
        marginBottom: '16px', 
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1, maxWidth: '100%' }}>
          <div style={{ flexGrow: 1, maxWidth: '300px' }}>
            <JsonFileSelector {...jsonFileSelectorProps} />
          </div>
          <button
            className="btn btn-outline-secondary ms-2"
            onClick={handleSavePreferences}
            disabled={!selectedFile || !tabState.data || tabState.data.length === 0}
            style={{ whiteSpace: 'nowrap' }}
          >
            Save Display Settings
          </button>
        </div>
        
        {/* Workflow instructions */}
        <div className="small text-muted">
          <strong>How to use:</strong> 1) Select a section code from the dropdown 2) Click "Process File" to load data and apply saved view settings
        </div>
      </div>

      {tabState.data && tabState.data.length > 0 ? (
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 220px)',
          overflow: 'visible',
          position: 'relative',
          backgroundColor: '#fff',
          borderRadius: '4px',
          border: '1px solid #ddd',
          minHeight: '0',
          minWidth: '0'
        }}>
          {dataTable}
        </div>
      ) : (
        <EmptyDataView {...emptyDataViewProps} />
      )}
    </div>
  );
}; 