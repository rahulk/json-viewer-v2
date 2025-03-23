import React, { useState } from 'react';
import './Tabs.css';

const Tabs = () => {
  const [activeTab, setActiveTab] = useState('tab1');

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="tabs">
      <ul className="tab-list">
        <li className={activeTab === 'tab1' ? 'active' : ''} onClick={() => handleTabClick('tab1')}>Tab 1</li>
        <li className={activeTab === 'tab2' ? 'active' : ''} onClick={() => handleTabClick('tab2')}>Tab 2</li>
        <li className={activeTab === 'tab3' ? 'active' : ''} onClick={() => handleTabClick('tab3')}>Tab 3</li>
        <li className={activeTab === 'tab4' ? 'active' : ''} onClick={() => handleTabClick('tab4')}>Tab 4</li>
        <li className={activeTab === 'tab5' ? 'active' : ''} onClick={() => handleTabClick('tab5')}>Tab 5</li>
      </ul>
      <div className="tab-content">
        {activeTab === 'tab1' && <div>Placeholder HTML Viewer for Tab 1</div>}
        {activeTab === 'tab2' && <div>Placeholder HTML Viewer for Tab 2</div>}
        {activeTab === 'tab3' && <div>Placeholder HTML Viewer for Tab 3</div>}
        {activeTab === 'tab4' && <div>Current Viewer for Tab 4</div>}
        {activeTab === 'tab5' && <div>Current Viewer for Tab 5</div>}
      </div>
    </div>
  );
};

export default Tabs;