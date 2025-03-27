const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { PDF_BASE_PATH } = require('../config/constants');

// Add new endpoint to get basic HTML content
router.get('/basic-html', async (req, res) => {
  console.log('\n=== 📄 BASIC HTML API CALL ===');
  console.log('Query parameters:', req.query);
  
  try {
    const { folderPath, filename } = req.query;
    
    if (!folderPath || !filename) {
      console.log('❌ Missing required parameters');
      return res.status(400).json({ error: 'Both folderPath and filename are required' });
    }

    // Remove .pdf extension and build the HTML path
    const baseFilename = filename.replace(/\.pdf$/i, '');
    const htmlPath = path.join(PDF_BASE_PATH, folderPath, 'basic_html', `${baseFilename}.html`);
    console.log('📂 Looking for HTML file at:', htmlPath);

    try {
      const htmlContent = await fs.readFile(htmlPath, 'utf-8');
      console.log('✅ HTML file loaded successfully');
      return res.json({ 
        success: true, 
        content: htmlContent 
      });
    } catch (error) {
      console.error('❌ Error reading HTML file:', error);
      return res.status(404).json({ 
        error: 'HTML file not found',
        path: htmlPath
      });
    }
  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({ error: 'Failed to get HTML content' });
  }
});

// HTML endpoint with folder, subFolder, file parameters
router.get('/html', (req, res) => {
  console.log('\n=== 📄 HTML API CALL ===');
  console.log('Query parameters:', req.query);
  
  const { folder, subFolder, file } = req.query;
  
  if (!folder || !subFolder || !file) {
    console.log('❌ Missing required parameters');
    return res.status(400).json({ 
      error: 'folder, subFolder, and file parameters are all required' 
    });
  }
  
  const filePath = path.join(PDF_BASE_PATH, folder, subFolder, file);
  console.log('📂 Looking for HTML file at:', filePath);
  
  // Use async fs instead of sync for better performance
  if (fsSync.existsSync(filePath)) {
    fsSync.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error('❌ Error reading HTML file:', err);
        return res.status(500).json({
          error: 'Error reading HTML file',
          message: err.message
        });
      }
      console.log('✅ HTML file loaded successfully, size:', data.length);
      res.send(data);
    });
  } else {
    console.error('❌ HTML file not found:', filePath);
    res.status(404).json({
      error: 'HTML file not found',
      path: filePath
    });
  }
});

module.exports = router; 