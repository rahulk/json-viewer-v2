import React from 'react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <div className="pdf-folders">
        <h3>PDF Folders</h3>
        <ul>
          <li>Folder 1</li>
          <li>Folder 2</li>
          <li>Folder 3</li>
        </ul>
      </div>
      <div className="pdf-files">
        <h3>PDF Files</h3>
        <ul>
          <li>File 1.pdf</li>
          <li>File 2.pdf</li>
          <li>File 3.pdf</li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;