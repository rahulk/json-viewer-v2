const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { PDF_BASE_PATH } = require('../config/constants');

// API endpoint to serve PDF files
router.get('/pdf', async (req, res) => {
  console.log('\n\n🔍🔍🔍 PDF ENDPOINT CALLED 🔍🔍🔍');
  console.log('Request query:', req.query);
  
  try {
    const relativePath = req.query.path || '';
    console.log('Raw PDF path received:', relativePath);
    
    // Decode the URL-encoded path
    const decodedPath = decodeURIComponent(relativePath);
    console.log('Decoded PDF path:', decodedPath);
    
    // Extract folder name and filename
    const pathParts = decodedPath.split('/');
    const folderName = pathParts[0];
    const filename = pathParts[pathParts.length - 1];
    
    console.log('Folder name:', folderName);
    console.log('File name:', filename);
    
    // Construct the correct path with repeated folder name
    const normalizedPath = path.join(folderName, folderName, filename);
    console.log('Normalized PDF path:', normalizedPath);
    
    // PDF_BASE_PATH already includes 'documents/output'
    const fullPath = path.join(PDF_BASE_PATH, normalizedPath);
    console.log('ABSOLUTE server file path:', fullPath);
    
    // Check if the file exists
    try {
      await fs.access(fullPath);
      console.log('✅ PDF FILE EXISTS:', fullPath);
    } catch (error) {
      console.error('❌ PDF FILE NOT FOUND:', fullPath);
      
      // Try to list the containing directory
      try {
        const parentDir = path.dirname(fullPath);
        console.log('Checking parent directory:', parentDir);
        const items = await fs.readdir(parentDir, { withFileTypes: true });
        const files = items.filter(item => item.isFile()).map(item => item.name);
        console.log('Files in parent directory:', files);
      } catch (dirError) {
        console.error('Parent directory does not exist:', dirError.message);
      }
      
      return res.status(404).json({ 
        error: 'PDF file not found',
        path: fullPath,
        message: error.message 
      });
    }
    
    // Set appropriate headers and serve the file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    
    const fileStream = fsSync.createReadStream(fullPath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving PDF:', error);
    return res.status(500).json({ error: 'Failed to serve PDF', message: error.message });
  }
});

// Add a test PDF endpoint that always works
router.get('/test-pdf', (req, res) => {
  console.log('Test PDF endpoint called');
  
  // Redirect to a public PDF - this is a Google Chrome PDF viewer test file
  res.redirect('https://storage.googleapis.com/chrome-devrel-public/pdf/hello.pdf');
});

module.exports = router; 