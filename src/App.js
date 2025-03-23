import React, { useState } from 'react';
import './App.css';
import { JsonProcessor } from './utils/JsonProcessor';
import { SAMPLE_JSON } from './constants/sampleData';
import { FileUploader } from './components/FileUploader';
import { TabPanel } from './components/TabPanel';

function App() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [activeTab, setActiveTab] = useState('results');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Process the selected files
  const processFiles = async () => {
    if (files.length === 0) {
      // If no files selected, use sample data for testing
      const processor = new JsonProcessor();
      const processedData = processor.processArray(SAMPLE_JSON);
      setResults([{
        name: 'sample-data.json',
        data: processedData,
        rawData: SAMPLE_JSON
      }]);
      setActiveFile(0);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const processedFiles = [];
      
      for (const file of files) {
        const content = await readFileAsJson(file);
        const dataToProcess = Array.isArray(content) ? content : [content];
        
        const processor = new JsonProcessor();
        const processed = processor.processArray(dataToProcess);
        
        processedFiles.push({
          name: file.name,
          data: processed,
          rawData: content
        });
      }
      
      setResults(processedFiles);
      if (processedFiles.length > 0) {
        setActiveFile(0);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to read file as JSON
  const readFileAsJson = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          resolve(json);
        } catch (err) {
          reject(new Error(`Invalid JSON in file ${file.name}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error(`Error reading file ${file.name}`));
      };
      
      reader.readAsText(file);
    });
  };

  // Get active file data
  const getActiveFileData = () => {
    if (activeFile === null || results.length === 0) return null;
    return results[activeFile];
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Dynamic JSON Processor</h1>
        <p>Process multiple JSON files with different structures</p>
      </header>
      
      <div className="container">
        <FileUploader
          onFileChange={setFiles}
          onProcess={processFiles}
          isLoading={isLoading}
          error={error}
        />
        
        {results.length > 0 && (
          <div className="results-container">
            <TabPanel
              results={results}
              activeFile={activeFile}
              activeTab={activeTab}
              onFileSelect={setActiveFile}
              onTabSelect={setActiveTab}
              getActiveFileData={getActiveFileData}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;