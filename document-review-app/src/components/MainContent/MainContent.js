import React, { useState } from 'react';
import './MainContent.css';
import PageViewer from '../PageViewer/PageViewer';
import Tabs from '../Tabs/Tabs';

const MainContent = () => {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { id: 1, label: 'Tab 1', content: 'HTML Viewer Placeholder' },
    { id: 2, label: 'Tab 2', content: 'HTML Viewer Placeholder' },
    { id: 3, label: 'Tab 3', content: 'HTML Viewer Placeholder' },
    { id: 4, label: 'Tab 4', content: 'JSON Viewer' },
    { id: 5, label: 'Tab 5', content: 'JSON Viewer' }
  ];

  return (
    <div className="main-content">
      <div className="content-viewer">
        <PageViewer />
      </div>
      <div className="content-tabs">
        <Tabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </div>
    </div>
  );
};

export default MainContent;