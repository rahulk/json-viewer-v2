import React from 'react';
import PageViewer from '../PageViewer';

const TabContent = ({ activeTab }) => {
  const renderContent = () => {
    switch (activeTab) {
      case 'tab1':
      case 'tab2':
      case 'tab3':
        return <div>This is a placeholder for the HTML viewer.</div>;
      case 'tab4':
      case 'tab5':
        return <PageViewer />;
      default:
        return null;
    }
  };

  return (
    <div className="tab-content">
      {renderContent()}
    </div>
  );
};

export default TabContent;