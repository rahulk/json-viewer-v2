import React from 'react';
import './Tabs.css';
import TabContent from './TabContent';

const Tabs = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map((tab, index) => (
          <div 
            key={tab.id}
            className={`tab ${activeTab === index ? 'active' : ''}`}
            onClick={() => onTabChange(index)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      <div className="tabs-content">
        <TabContent 
          tab={tabs[activeTab]} 
          isJsonViewer={activeTab === 3 || activeTab === 4} 
        />
      </div>
    </div>
  );
};

export default Tabs;