import React, { useEffect, useRef, useState } from 'react';
import { HtmlContentView } from './HtmlContentView';
import { DataTableTab } from './DataTableTab';
import config from '../config';

/**
 * Component that renders different content based on the selected tab
 */
export const TabContent = ({ 
  selectedTab, 
  htmlContents, 
  tab4State, 
  tab5State, 
  handleTab4StateChange, 
  handleTab5StateChange,
  processFiles,
  folderPath,
  pdfFilename,
  parsedJsons,
  enhancedJsons
}) => {
  // Track previous tab selection for debugging
  const prevSelectedTabRef = useRef(selectedTab);
  
  // Store selected files for each tab to preserve selection across tab switches
  const [parsedTabSelectedFile, setParsedTabSelectedFile] = useState('');
  const [enhancedTabSelectedFile, setEnhancedTabSelectedFile] = useState('');
  
  // Track last processed files to avoid re-processing
  const [parsedTabLastProcessed, setParsedTabLastProcessed] = useState('');
  const [enhancedTabLastProcessed, setEnhancedTabLastProcessed] = useState('');
  
  // Debug logging for tab changes
  useEffect(() => {
    if (prevSelectedTabRef.current !== selectedTab) {
      console.log(`Tab changed from ${prevSelectedTabRef.current} to ${selectedTab}`);
      prevSelectedTabRef.current = selectedTab;
    }
  }, [selectedTab]);

  // Debug logging for prop changes
  useEffect(() => {
    console.log('TabContent received JSON files:', {
      parsed: parsedJsons,
      enhanced: enhancedJsons,
      folderPath,
      pdfFilename
    });
  }, [parsedJsons, enhancedJsons, folderPath, pdfFilename]);

  // Debug logging for tab state to verify correct usage
  useEffect(() => {
    if (selectedTab === config.TABS.INDICES.PARSED_JSON) {
      console.log('Tab 4 (Parsed) state:', {
        dataCount: tab4State.data?.length || 0,
        columnsVisible: Object.keys(tab4State.columnVisibility || {}).length,
        columnWidths: Object.keys(tab4State.columnWidths || {}).length,
        columnOrderLength: (tab4State.columnOrder || []).length,
      });
    } else if (selectedTab === config.TABS.INDICES.ENHANCED_JSON) {
      console.log('Tab 5 (Enhanced) state:', {
        dataCount: tab5State.data?.length || 0,
        columnsVisible: Object.keys(tab5State.columnVisibility || {}).length,
        columnWidths: Object.keys(tab5State.columnWidths || {}).length,
        columnOrderLength: (tab5State.columnOrder || []).length,
      });
    }
  }, [selectedTab, tab4State, tab5State]);

  // Handlers for updating selected files for each tab
  const handleParsedFileSelect = (filename) => {
    setParsedTabSelectedFile(filename);
  };

  const handleEnhancedFileSelect = (filename) => {
    setEnhancedTabSelectedFile(filename);
  };
  
  // Handlers for tracking last processed files
  const handleParsedProcessedFile = (filename) => {
    setParsedTabLastProcessed(filename);
  };
  
  const handleEnhancedProcessedFile = (filename) => {
    setEnhancedTabLastProcessed(filename);
  };

  // Render appropriate content based on selected tab
  switch (selectedTab) {
    case config.TABS.INDICES.BASIC_HTML:
      return (
        <div style={config.UI.STYLES.CONTENT_CONTAINER}>
          <HtmlContentView content={htmlContents[0]} />
        </div>
      );
    case config.TABS.INDICES.ENHANCED_HTML:
      return (
        <div style={config.UI.STYLES.CONTENT_CONTAINER}>
          <HtmlContentView content={htmlContents[1]} />
        </div>
      );
    case config.TABS.INDICES.MODIFIED_HTML:
      return (
        <div style={config.UI.STYLES.CONTENT_CONTAINER}>
          <HtmlContentView content={htmlContents[2]} />
        </div>
      );
    case config.TABS.INDICES.PARSED_JSON:
      return (
        <DataTableTab
          tabType="parsed"
          jsonFiles={parsedJsons}
          tabState={tab4State}
          handleTabStateChange={handleTab4StateChange}
          folderPath={folderPath}
          pdfFilename={pdfFilename}
          processFiles={processFiles}
          showColorHighlighting={config.UI.FEATURES.ENABLE_COLOR_HIGHLIGHTING_FOR_PARSED}
          savedSelectedFile={parsedTabSelectedFile}
          onFileSelect={handleParsedFileSelect}
          lastProcessedFile={parsedTabLastProcessed}
          onFileProcessed={handleParsedProcessedFile}
        />
      );
    case config.TABS.INDICES.ENHANCED_JSON:
      return (
        <DataTableTab
          tabType="enhanced"
          jsonFiles={enhancedJsons}
          tabState={tab5State}
          handleTabStateChange={handleTab5StateChange}
          folderPath={folderPath}
          pdfFilename={pdfFilename}
          processFiles={processFiles}
          showColorHighlighting={config.UI.FEATURES.ENABLE_COLOR_HIGHLIGHTING_FOR_ENHANCED}
          savedSelectedFile={enhancedTabSelectedFile}
          onFileSelect={handleEnhancedFileSelect}
          lastProcessedFile={enhancedTabLastProcessed}
          onFileProcessed={handleEnhancedProcessedFile}
        />
      );
    default:
      return null;
  }
};