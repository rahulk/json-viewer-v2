import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="app-header">
      <div className="header-left">
        <h1>Document Review Application</h1>
      </div>
      <div className="header-right">
        <div className="user-settings">
          <span className="username">User</span>
          <button className="settings-button">⚙️</button>
        </div>
      </div>
    </header>
  );
};

export default Header;