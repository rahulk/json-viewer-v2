import React from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import './App.css';

function App() {
  return (
    <div className="app">
      <Header />
      <div className="app-layout">
        <Sidebar />
        <MainContent />
      </div>
    </div>
  );
}

export default App;