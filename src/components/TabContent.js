import React, { useEffect, useRef } from 'react';
import { HtmlContentView } from './HtmlContentView';
import { DataTableTab } from './DataTableTab';

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
    if (selectedTab === 3) {
      console.log('Tab 4 (Parsed) state:', {
        dataCount: tab4State.data?.length || 0,
        columnsVisible: Object.keys(tab4State.columnVisibility || {}).length,
        columnWidths: Object.keys(tab4State.columnWidths || {}).length,
        columnOrderLength: (tab4State.columnOrder || []).length,
      });
    } else if (selectedTab === 4) {
      console.log('Tab 5 (Enhanced) state:', {
        dataCount: tab5State.data?.length || 0,
        columnsVisible: Object.keys(tab5State.columnVisibility || {}).length,
        columnWidths: Object.keys(tab5State.columnWidths || {}).length,
        columnOrderLength: (tab5State.columnOrder || []).length,
      });
    }
  }, [selectedTab, tab4State, tab5State]);

  // Render appropriate content based on selected tab
  switch (selectedTab) {
    case 0:
      return (
        <div style={{ height: '100%', overflow: 'visible' }}>
          <HtmlContentView content={htmlContents[0]} />
        </div>
      );
    case 1:
      return (
        <div style={{ height: '100%', overflow: 'visible' }}>
          <HtmlContentView content={htmlContents[1]} />
        </div>
      );
    case 2:
      return (
        <div style={{ height: '100%', overflow: 'visible' }}>
          <HtmlContentView content={htmlContents[2]} />
        </div>
      );
    case 3:
      return (
        <DataTableTab
          tabType="parsed"
          jsonFiles={parsedJsons}
          tabState={tab4State}
          handleTabStateChange={handleTab4StateChange}
          folderPath={folderPath}
          pdfFilename={pdfFilename}
          processFiles={processFiles}
          showColorHighlighting={false}
        />
      );
    case 4:
      return (
        <DataTableTab
          tabType="enhanced"
          jsonFiles={enhancedJsons}
          tabState={tab5State}
          handleTabStateChange={handleTab5StateChange}
          folderPath={folderPath}
          pdfFilename={pdfFilename}
          processFiles={processFiles}
          showColorHighlighting={true}
        />
      );
    default:
      return null;
  }
};