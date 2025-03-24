import React from 'react';
import { FlatDataTable } from './FlatDataTable';

export const TabContent = ({ 
  selectedTab, 
  htmlContents, 
  tab4State, 
  tab5State, 
  handleTab4StateChange, 
  handleTab5StateChange,
  processFiles
}) => {
  console.log('TabContent rendering with selectedTab:', selectedTab);
  console.log('Tab4State:', tab4State);
  console.log('Tab5State:', tab5State);

  const renderHtmlContent = (content, title) => (
    <div className="html-viewer" style={{ border: '1px solid #ccc', padding: '10px', height: 'calc(100% - 60px)', overflow: 'auto' }}>
      <h4>{title}</h4>
      <div 
        style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
        dangerouslySetInnerHTML={{ __html: content }}
      ></div>
    </div>
  );

  const renderTab4Content = () => {
    return (
      <div className="json-viewer" style={{ border: '1px solid #ccc', padding: '10px', height: 'calc(100% - 60px)', overflow: 'auto' }}>
        <h4>JSON Viewer - Tab 4</h4>
        {tab4State.data && tab4State.data.length > 0 ? (
          <div className="table-view">
            <FlatDataTable 
              key="tab4-table"
              data={tab4State.data}
              sectionCode="TAB4"
              showColumnSelection={true}
              allowTextWrapping={tab4State.wrapText}
              showColorHighlighting={tab4State.filterColoredText}
              initialColumnVisibility={tab4State.columnVisibility}
              onStateChange={handleTab4StateChange}
              title="Flat Data View (TAB4)"
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>No data available for Tab 4. Please select a file and click "Process Files".</p>
            <button 
              className="btn btn-primary mt-2"
              onClick={processFiles}
            >
              Load Sample Data
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderTab5Content = () => {
    return (
      <div className="json-viewer" style={{ border: '1px solid #ccc', padding: '10px', height: 'calc(100% - 60px)', overflow: 'auto' }}>
        <h4>JSON Viewer - Tab 5</h4>
        {tab5State.data && tab5State.data.length > 0 ? (
          <div className="table-view">
            <FlatDataTable 
              key="tab5-table"
              data={tab5State.data}
              sectionCode="TAB5"
              showColumnSelection={true}
              allowTextWrapping={tab5State.wrapText}
              showColorHighlighting={tab5State.filterColoredText}
              initialColumnVisibility={tab5State.columnVisibility}
              onStateChange={handleTab5StateChange}
              title="Flat Data View (TAB5)"
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>No data available for Tab 5. Please select a file and click "Process Files".</p>
            <button 
              className="btn btn-primary mt-2"
              onClick={processFiles}
            >
              Load Sample Data
            </button>
          </div>
        )}
      </div>
    );
  };

  // Use separate render functions for each tab to ensure complete separation
  switch (selectedTab) {
    case 0:
      return renderHtmlContent(htmlContents[0], 'HTML Viewer - Tab 1');
    case 1:
      return renderHtmlContent(htmlContents[1], 'HTML Viewer - Tab 2');
    case 2:
      return renderHtmlContent(htmlContents[2], 'HTML Viewer - Tab 3');
    case 3:
      return renderTab4Content();
    case 4:
      return renderTab5Content();
    default:
      return null;
  }
}; 