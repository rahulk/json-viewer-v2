import React, { useState } from 'react';
import PageViewer from '../PageViewer';
import Tabs from '../Tabs';
import './MainContent.css';

const MainContent = () => {
  const [activeTab, setActiveTab] = useState('tab1');

  return (
    <div className="main-content">
      <div className="page-viewer">
        <PageViewer />
      </div>
      <div className="tabs-container">
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};

export default MainContent;