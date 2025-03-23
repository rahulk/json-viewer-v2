import React from 'react';
import './MainContent.css';
import PageViewer from '../PageViewer';
import Tabs from '../Tabs';

const MainContent = () => {
  return (
    <div className="main-content">
      <div className="page-viewer">
        <PageViewer />
      </div>
      <div className="tabs-container">
        <Tabs />
      </div>
    </div>
  );
};

export default MainContent;