import React, { useState, useEffect } from 'react';

export const PdfViewer = ({ pdfUrl, fileName }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfLoaded, setPdfLoaded] = useState(false);
  const [statusCode, setStatusCode] = useState(null);
  
  useEffect(() => {
    if (pdfUrl) {
      setLoading(true);
      setError(null);
      setPdfLoaded(false);
      setStatusCode(null);
      
      // Check if PDF URL is valid by making a HEAD request
      fetch(pdfUrl)
        .then(response => {
          setLoading(false);
          setStatusCode(response.status);
          
          if (!response.ok) {
            // Try to parse the error response
            return response.json().then(errorData => {
              console.error('PDF error details:', errorData);
              setError(`Error (${response.status}): ${errorData.error || response.statusText}`);
            }).catch(() => {
              // If can't parse as JSON, use the status text
              setError(`Error loading PDF: ${response.statusText} (${response.status})`);
            });
          }
        })
        .catch(err => {
          setLoading(false);
          setError(`Error accessing PDF: ${err.message}`);
          console.error('PDF fetch error:', err);
        });
    }
  }, [pdfUrl]);
  
  const handlePdfLoad = () => {
    console.log('PDF loaded successfully');
    setPdfLoaded(true);
    setLoading(false);
  };
  
  const handlePdfError = () => {
    console.error('PDF failed to load in <object> tag');
    // Only set error if it's not already set by the fetch check
    if (!error) {
      setError('PDF failed to load in viewer. Try opening in a new tab.');
    }
    setLoading(false);
  };

  const testPdf = () => {
    // Open test PDF in new tab to verify PDF viewing works
    window.open('http://localhost:3001/api/test-pdf', '_blank');
  };

  const createDocumentsFolder = () => {
    alert(
      "Server directory structure issue detected!\n\n" +
      "Try one of these solutions:\n\n" +
      "1. Create the directory structure in your server folder:\n" +
      "   - server/documents/output/[folder name]/\n\n" +
      "2. Set the PDF_BASE_PATH environment variable to your actual PDFs location"
    );
  };
  
  if (!pdfUrl) {
    return (
      <div className="pdf-viewer-placeholder" style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        flexDirection: 'column', 
        backgroundColor: '#f8f9fa', 
        border: '1px dashed #ccc' 
      }}>
        <svg width="80" height="80" fill="#6c757d" viewBox="0 0 16 16">
          <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
          <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388-.13-.776.08-1.102.198-.307.526-.568.897-.787a7.68 7.68 0 0 1 1.482-.645 19.697 19.697 0 0 0 1.062-2.227 7.269 7.269 0 0 1-.43-1.295c-.086-.4-.119-.796-.046-1.136.075-.354.274-.672.65-.823.192-.077.4-.12.602-.077a.7.7 0 0 1 .477.365c.088.164.12.356.127.538.007.188-.012.396-.047.614-.084.51-.27 1.134-.52 1.794a10.954 10.954 0 0 0 .98 1.686 5.753 5.753 0 0 1 1.334.05c.364.066.734.195.96.465.12.144.193.32.2.518.007.192-.047.382-.138.563a1.04 1.04 0 0 1-.354.416.856.856 0 0 1-.51.138c-.331-.014-.654-.196-.933-.417a5.712 5.712 0 0 1-.911-.95 11.651 11.651 0 0 0-1.997.406 11.307 11.307 0 0 1-1.02 1.51c-.292.35-.609.656-.927.787a.793.793 0 0 1-.58.029zm1.379-1.901c-.166.076-.32.156-.459.238-.328.194-.541.383-.647.547-.094.145-.096.25-.04.361.01.022.02.036.026.044a.266.266 0 0 0 .035-.012c.137-.056.355-.235.635-.572a8.18 8.18 0 0 0 .45-.606zm1.64-1.33a12.71 12.71 0 0 1 1.01-.193 11.744 11.744 0 0 1-.51-.858 20.801 20.801 0 0 1-.5 1.05zm2.446.45c.15.163.296.3.435.41.24.19.407.253.498.256a.107.107 0 0 0 .07-.015.307.307 0 0 0 .094-.125.436.436 0 0 0 .059-.2.095.095 0 0 0-.026-.063c-.052-.062-.2-.152-.518-.209a3.876 3.876 0 0 0-.612-.053zM8.078 7.8a6.7 6.7 0 0 0 .2-.828c.031-.188.043-.343.038-.465a.613.613 0 0 0-.032-.198.517.517 0 0 0-.145.04c-.087.035-.158.106-.196.283-.04.192-.03.469.046.822.024.111.054.227.09.346z"/>
        </svg>
        <p className="mt-3 text-muted">Select a PDF file to view</p>
        <button 
          className="btn btn-sm btn-outline-primary mt-3"
          onClick={testPdf}
        >
          Test PDF Viewer
        </button>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className="pdf-loading" style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column' 
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading PDF...</span>
        </div>
        <p className="mt-3">Loading PDF: {fileName}</p>
        <p className="text-muted small">URL: {pdfUrl}</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="pdf-error" style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexDirection: 'column',
        color: '#dc3545' 
      }}>
        <svg width="60" height="60" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
        </svg>
        <p className="mt-3">{error}</p>
        <div className="mt-3">
          <p className="text-muted small">PDF URL: {pdfUrl}</p>
          <p className="text-muted small">Filename: {fileName}</p>
          <div className="mt-3">
            <button
              onClick={testPdf}
              className="btn btn-sm btn-success me-2"
            >
              Test PDF Viewer
            </button>
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-sm btn-primary me-2"
            >
              Try in New Tab
            </a>
          </div>
          
          {statusCode === 404 && (
            <div className="alert alert-warning mt-3" style={{ maxWidth: '500px' }}>
              <strong>File Not Found Error!</strong>
              <p className="mb-2">The server couldn't find the PDF file at the expected location.</p>
              <button 
                className="btn btn-sm btn-warning"
                onClick={createDocumentsFolder}
              >
                How to Fix This
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="pdf-viewer" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="pdf-viewer-header" style={{ 
        padding: '10px', 
        borderBottom: '1px solid #dee2e6', 
        backgroundColor: '#f8f9fa',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h5 style={{ margin: 0 }}>
          <span className="text-danger">
            <i className="bi bi-file-pdf-fill me-2"></i>
          </span>
          {fileName}
        </h5>
        <div>
          <button
            onClick={testPdf}
            className="btn btn-sm btn-outline-success me-2"
          >
            Test PDF
          </button>
          <a 
            href={pdfUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-primary"
          >
            Open in New Tab
          </a>
        </div>
      </div>
      <div className="pdf-viewer-content" style={{ flex: 1, overflow: 'hidden' }}>
        <object
          data={pdfUrl}
          type="application/pdf"
          width="100%"
          height="100%"
          style={{ border: 'none' }}
          onLoad={handlePdfLoad}
          onError={handlePdfError}
        >
          <p>
            Your browser doesn't support PDF viewing. 
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer">Click here to download the PDF</a>.
          </p>
        </object>
        
        {/* Overlay to detect if object is actually loading with PDF content */}
        {!pdfLoaded && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            background: 'rgba(255,255,255,0.8)',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            Waiting for PDF to load... If it doesn't appear, try opening in a new tab.
          </div>
        )}
      </div>
    </div>
  );
};