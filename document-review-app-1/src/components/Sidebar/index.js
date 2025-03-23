import React from 'react';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <div className="sidebar">
      <h2>PDF Folders</h2>
      <ul>
        <li>Folder 1</li>
        <li>Folder 2</li>
        <li>Folder 3</li>
      </ul>
      <h2>PDF Files</h2>
      <ul>
        <li>File 1.pdf</li>
        <li>File 2.pdf</li>
        <li>File 3.pdf</li>
      </ul>
    </div>
  );
};

export default Sidebar;