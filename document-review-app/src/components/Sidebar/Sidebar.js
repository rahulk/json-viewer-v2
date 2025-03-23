import React from 'react';
import './Sidebar.css';

const Sidebar = () => {
  // Placeholder data
  const folders = [
    { id: 1, name: 'Project Documents' },
    { id: 2, name: 'Client Contracts' },
    { id: 3, name: 'Internal Policies' },
    { id: 4, name: 'Annual Reports' }
  ];

  const files = [
    { id: 1, name: 'Contract_2023.pdf' },
    { id: 2, name: 'Policy_Handbook.pdf' },
    { id: 3, name: 'Annual_Report_2022.pdf' },
    { id: 4, name: 'Meeting_Minutes.pdf' },
    { id: 5, name: 'Project_Proposal.pdf' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-section folders-section">
        <h3 className="section-heading">PDF Folders</h3>
        <ul className="item-list">
          {folders.map(folder => (
            <li key={folder.id} className="list-item">
              <span className="folder-icon">📁</span> {folder.name}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="sidebar-section files-section">
        <h3 className="section-heading">PDF Files</h3>
        <ul className="item-list">
          {files.map(file => (
            <li key={file.id} className="list-item">
              <span className="file-icon">📄</span> {file.name}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;