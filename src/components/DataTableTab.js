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
 * @param {string} props.savedSelectedFile - Saved selected file from parent to persist across tab switches
 * @param {Function} props.onFileSelect - Callback to update the saved selected file in parent
 * @param {string} props.lastProcessedFile - Last successfully processed file for this tab
 * @param {Function} props.onFileProcessed - Callback when a file is successfully processed
 */
export const DataTableTab = ({
  tabType,
  jsonFiles,
  tabState,
  handleTabStateChange,
  folderPath,
  pdfFilename,
  processFiles,
  showColorHighlighting = false,
  savedSelectedFile = '',
  onFileSelect,
  lastProcessedFile = '',
  onFileProcessed
}) => {
  // References and memoized values
  const tableRef = useRef(null);
  const tableKey = useMemo(() => `${tabType}-fixed-instance`, [tabType]);
  const lastProcessedFileRef = useRef(lastProcessedFile || null);
  const componentMountedRef = useRef(false);
  
  // Update ref when prop changes
  useEffect(() => {
    if (lastProcessedFile && lastProcessedFile !== lastProcessedFileRef.current) {
      lastProcessedFileRef.current = lastProcessedFile;
    }
  }, [lastProcessedFile]);
  
  // Custom hooks
  const { saveDisplayPreferences, loadDisplayPreferences } = usePreferences(pdfFilename);
  const { selectedFile, handleFileSelect, sectionCode } = useFileSelector(handleTabStateChange, tabType);
  const { isLoading, processJsonFile } = useJsonProcessor(folderPath, loadDisplayPreferences);
  
  // Track when the component has mounted
  useEffect(() => {
    componentMountedRef.current = true;
    return () => {
      componentMountedRef.current = false;
    };
  }, []);
  
  // Sync with saved file when component mounts or when savedSelectedFile changes
  useEffect(() => {
    // Only update if there's a saved file and it's different from current selection
    if (savedSelectedFile && savedSelectedFile !== selectedFile) {
      console.log(`Restoring saved selection for ${tabType} tab:`, savedSelectedFile);
      
      // When we're restoring from a tab switch and we already have data for this file,
      // make sure we don't reset the data state
      if (
        savedSelectedFile === lastProcessedFile && 
        tabState.data && 
        tabState.data.length > 0 &&
        componentMountedRef.current
      ) {
        console.log(`Data already loaded for ${savedSelectedFile}, just updating selection`);
        handleFileSelect(savedSelectedFile, true); // Pass true to prevent data reset
      } else {
        handleFileSelect(savedSelectedFile);
      }
    }
  }, [savedSelectedFile, selectedFile, handleFileSelect, tabType, lastProcessedFile, tabState.data]);
  
  // Handle changes in folder path or PDF filename to reset process tracking
  useEffect(() => {
    lastProcessedFileRef.current = null;
    if (onFileProcessed) {
      onFileProcessed('');
    }
  }, [folderPath, pdfFilename, onFileProcessed]);
  
  // Custom file select handler that also updates parent state
  const handleFileSelectWithParent = useCallback((filename) => {
    // Update local state
    handleFileSelect(filename);
    
    // Update parent state to persist selection across tab switches
    if (onFileSelect) {
      onFileSelect(filename);
    }
  }, [handleFileSelect, onFileSelect]);
  
  // Handler for processing the selected file
  const handleProcessFile = useCallback(() => {
    if (!selectedFile) {
      console.log('No file selected, ignoring process request');
      return;
    }
    
    // Check if this file was already processed and data exists
    const alreadyProcessed = selectedFile === lastProcessedFileRef.current && 
                            tabState.data && 
                            tabState.data.length > 0;
    
    if (alreadyProcessed) {
      console.log(`File ${selectedFile} already processed with data, no need to reload`);
      return;
    }
    
    // Process the file
    console.log(`Processing file ${selectedFile} for ${tabType} tab`);
    processJsonFile(tabType, selectedFile, handleTabStateChange);
    
    // Update tracking after processing
    lastProcessedFileRef.current = selectedFile;
    if (onFileProcessed) {
      onFileProcessed(selectedFile);
    }
  }, [selectedFile, lastProcessedFileRef, tabState.data, processJsonFile, tabType, handleTabStateChange, onFileProcessed]);
  
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
    onFileSelect: handleFileSelectWithParent,
    isLoading,
    onProcessFile: handleProcessFile
  }), [jsonFiles, selectedFile, handleFileSelectWithParent, isLoading, handleProcessFile]);

  const emptyDataViewProps = useMemo(() => ({
    title: `No ${tabType === 'enhanced' ? 'Enhanced ' : ''}Data Loaded`,
    sectionCode,
    isLoading,
    onLoadData: handleProcessFile,
    onLoadSampleData: processFiles
  }), [tabType, sectionCode, isLoading, handleProcessFile, processFiles]);
  
  // Debug info for state tracking
  useEffect(() => {
    console.log(`[${tabType}] Tab State:`, {
      lastProcessed: lastProcessedFileRef.current,
      selectedFile,
      hasData: tabState.data && tabState.data.length > 0,
      dataCount: tabState.data?.length || 0,
    });
  }, [tabType, selectedFile, tabState.data]);
  
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ maxWidth: '300px' }}>
            <JsonFileSelector {...jsonFileSelectorProps} />
          </div>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={handleSavePreferences}
            disabled={!selectedFile || !tabState.data || tabState.data.length === 0}
            style={{ whiteSpace: 'nowrap' }}
          >
            Save View
          </button>
        </div>
        
        {/* User instructions */}
        <div className="small text-muted">
          <strong>How to use:</strong> 1) Select a section code 2) Click "Load Data" 
          {lastProcessedFileRef.current && selectedFile === lastProcessedFileRef.current && tabState.data && tabState.data.length > 0 && (
            <span className="text-success"> (✓ Data loaded)</span>
          )}
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