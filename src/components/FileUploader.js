import React from 'react';

export const FileUploader = ({ onFileChange, onProcess, isLoading, error }) => {
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);
    onFileChange(selectedFiles);
  };

  return (
    <div className="file-selection">
      <h2>Select JSON Files</h2>
      <input 
        type="file" 
        multiple 
        accept=".json" 
        onChange={handleFileChange} 
      />
      <p>Or use <button onClick={onProcess}>sample data</button></p>
      
      <button 
        onClick={onProcess} 
        disabled={isLoading}
        className="process-button"
      >
        {isLoading ? 'Processing...' : 'Process Files'}
      </button>
      
      {error && <div className="error">{error}</div>}
    </div>
  );
}; 