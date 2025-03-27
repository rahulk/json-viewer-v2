const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { PDF_BASE_PATH } = require('../config/constants');

// API endpoint to get folders
router.get('/folders', async (req, res) => {
  try {
    const relativePath = req.query.path || '/documents/output';
    // Remove the leading slash if present to prevent double slashes
    const normalizedPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    const fullPath = path.join(__dirname, '../../', normalizedPath);
    
    console.log('Fetching folders from:', fullPath);
    
    // Check if the directory exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({ 
        error: 'Directory not found',
        path: fullPath,
        message: error.message 
      });
    }
    
    // Get directory contents
    const items = await fs.readdir(fullPath, { withFileTypes: true });
    
    // Filter directories only
    const folders = items
      .filter(item => item.isDirectory())
      .map(item => item.name);
    
    return res.json({ folders });
  } catch (error) {
    console.error('Error getting folders:', error);
    return res.status(500).json({ error: 'Failed to get folders', message: error.message });
  }
});

// API endpoint to get files from a folder
router.get('/files', async (req, res) => {
  try {
    const relativePath = req.query.path || '/documents/output';
    console.log('Raw path received:', relativePath);
    
    // Decode the URL-encoded path
    const decodedPath = decodeURIComponent(relativePath);
    console.log('Decoded path:', decodedPath);
    
    // Remove the leading slash if present to prevent double slashes
    const normalizedPath = decodedPath.startsWith('/') ? decodedPath.substring(1) : decodedPath;
    console.log('Normalized path:', normalizedPath);
    
    const fullPath = path.join(__dirname, '../../', normalizedPath);
    console.log('Full path for files lookup:', fullPath);
    
    // Check if the directory exists
    try {
      await fs.access(fullPath);
    } catch (error) {
      console.error('Directory not found:', fullPath);
      return res.status(404).json({ 
        error: 'Directory not found',
        path: fullPath,
        message: error.message 
      });
    }
    
    // Get directory contents
    const items = await fs.readdir(fullPath, { withFileTypes: true });
    
    // Filter files only
    const files = items
      .filter(item => item.isFile())
      .map(item => item.name);
    
    console.log('Found files:', files);
    return res.json({ files });
  } catch (error) {
    console.error('Error getting files:', error);
    return res.status(500).json({ error: 'Failed to get files', message: error.message });
  }
});

module.exports = router; 