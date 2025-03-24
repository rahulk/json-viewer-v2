import React from 'react';
import FileBrowser from './components/FileBrowser';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>PDF & JSON Viewer</h1>
      </header>
      <main>
        <FileBrowser />
      </main>
      <footer>
        <p>PDF & JSON Viewer Application</p>
      </footer>
    </div>
  );
}

export default App; 