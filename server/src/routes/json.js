const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const config = require('../config/config');
const { extractSectionCode } = require('../utils/fileUtils');

// API endpoint to get parsed JSON files associated with a PDF
router.get(config.API.ENDPOINTS.PARSED_JSONS, async (req, res) => {
  console.log('\n=== PARSED JSONS API CALL ===');
  console.log('Query parameters:', req.query);
  
  try {
    const { folderPath, pdfFilename } = req.query;
    
    if (!folderPath || !pdfFilename) {
      console.log('❌ Missing required parameters');
      return res.status(400).json({ error: 'Both folderPath and pdfFilename are required' });
    }
    
    // Build the correct path to include documents directory
    const jsonFolderPath = path.join(config.PATHS.PDF_BASE_PATH, folderPath, config.PATHS.SUBFOLDERS.PARSED_JSONS);
    console.log('Looking in folder:', jsonFolderPath);
    
    // Remove file extension from PDF filename
    const baseFilename = pdfFilename.replace(new RegExp(config.FILES.EXTENSIONS.PDF + '$', 'i'), '');
    console.log('Base filename:', baseFilename);

    try {
      await fs.access(jsonFolderPath);
      console.log('✅ Directory exists:', jsonFolderPath);
    } catch (error) {
      console.log('📁 Creating directory:', jsonFolderPath);
      await fs.mkdir(jsonFolderPath, { recursive: true });
    }

    const files = await fs.readdir(jsonFolderPath);
    console.log('Files in directory:', files);
    
    const matchingJsonFiles = files
      .filter(file => {
        const matches = file.startsWith(baseFilename + '_') && file.endsWith(config.FILES.EXTENSIONS.JSON);
        console.log(`File: ${file}, Matches: ${matches}`);
        return matches;
      })
      .map(file => {
        const sectionCode = extractSectionCode(file, false);
        console.log(`Extracted section code for ${file}:`, sectionCode);
        return {
          filename: file,
          sectionCode: sectionCode
        };
      });

    const response = {
      pdfFilename,
      jsonFiles: matchingJsonFiles,
      basePath: jsonFolderPath
    };
    
    console.log('Sending response:', response);
    return res.json(response);
    
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ error: 'Failed to get parsed JSON files', message: error.message });
  }
});

// Similar update for enhanced-jsons endpoint
router.get(config.API.ENDPOINTS.ENHANCED_JSONS, async (req, res) => {
  console.log('\n=== ENHANCED JSONS API CALL ===');
  console.log('Query parameters:', req.query);
  
  try {
    const { folderPath, pdfFilename } = req.query;
    
    if (!folderPath || !pdfFilename) {
      console.log('❌ Missing required parameters');
      return res.status(400).json({ error: 'Both folderPath and pdfFilename are required' });
    }
    
    // Build the correct path to include documents directory
    const jsonFolderPath = path.join(config.PATHS.PDF_BASE_PATH, folderPath, config.PATHS.SUBFOLDERS.ENHANCED_JSONS);
    console.log('Looking in folder:', jsonFolderPath);
    
    // Remove file extension from PDF filename
    const baseFilename = pdfFilename.replace(new RegExp(config.FILES.EXTENSIONS.PDF + '$', 'i'), '');
    console.log('Base filename:', baseFilename);

    try {
      await fs.access(jsonFolderPath);
      console.log('✅ Directory exists:', jsonFolderPath);
    } catch (error) {
      console.log('📁 Creating directory:', jsonFolderPath);
      await fs.mkdir(jsonFolderPath, { recursive: true });
    }

    const files = await fs.readdir(jsonFolderPath);
    console.log('Files in directory:', files);
    
    const matchingJsonFiles = files
      .filter(file => {
        const matches = file.startsWith(baseFilename + '_') && file.endsWith(config.FILES.EXTENSIONS.ENHANCED_JSON_SUFFIX);
        console.log(`File: ${file}, Matches: ${matches}`);
        return matches;
      })
      .map(file => {
        const sectionCode = extractSectionCode(file, true);
        console.log(`Extracted section code for ${file}:`, sectionCode);
        return {
          filename: file,
          sectionCode: sectionCode
        };
      });

    const response = {
      pdfFilename,
      jsonFiles: matchingJsonFiles,
      basePath: jsonFolderPath
    };
    
    console.log('Sending response:', response);
    return res.json(response);
    
  } catch (error) {
    console.error('❌ Error:', error);
    return res.status(500).json({ error: 'Failed to get enhanced JSON files', message: error.message });
  }
});

// Add this endpoint to process JSON files
router.get(config.API.ENDPOINTS.PROCESS_JSON, async (req, res) => {
  console.log('\n=== 🔄 PROCESS JSON API CALL ===');
  console.log('⏰ Timestamp:', new Date().toISOString());
  console.log('📝 Query parameters:', req.query);

  try {
    const { filePath } = req.query;
    
    if (!filePath) {
      console.log('❌ Missing filePath parameter');
      return res.status(400).json({ error: 'filePath parameter is required' });
    }

    // Build the absolute path to the JSON file
    const fullPath = path.join(config.PATHS.PDF_BASE_PATH, filePath);
    console.log('📂 Looking for JSON file at:', fullPath);

    try {
      await fs.access(fullPath);
      console.log('✅ File exists');

      console.log('📖 Reading file contents...');
      const fileContent = await fs.readFile(fullPath, 'utf-8');
      
      console.log('🔄 Parsing JSON...');
      let jsonData = JSON.parse(fileContent);
      
      // Ensure the data is an array
      if (!Array.isArray(jsonData)) {
        console.log('⚠️ Data is not an array, checking structure...');
        
        // Check if data is in a nested property
        if (jsonData.data && Array.isArray(jsonData.data)) {
          console.log('✅ Found array data in .data property');
          jsonData = jsonData.data;
        } else if (jsonData.results && Array.isArray(jsonData.results)) {
          console.log('✅ Found array data in .results property');
          jsonData = jsonData.results;
        } else {
          // Convert object to array if needed
          console.log('⚠️ Converting to array format');
          jsonData = [jsonData];
        }
      }

      const recordCount = jsonData.length;
      console.log('✅ Successfully processed JSON file');
      console.log('📊 Number of records:', recordCount);
      console.log('🔍 Data structure:', {
        isArray: Array.isArray(jsonData),
        length: recordCount,
        sampleKeys: recordCount > 0 ? Object.keys(jsonData[0]).slice(0, 5) : []
      });

      const response = {
        success: true,
        results: jsonData,
        metadata: {
          processedAt: new Date().toISOString(),
          recordCount: recordCount
        }
      };

      console.log('📤 Sending response');
      console.log('=== END PROCESS JSON API CALL ===\n');
      return res.json(response);

    } catch (error) {
      console.error('❌ Error reading/parsing JSON file:', {
        error: error.message,
        stack: error.stack
      });
      return res.status(500).json({ 
        error: 'Failed to process JSON file',
        message: error.message,
        path: fullPath
      });
    }
  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({ 
      error: 'Server error while processing JSON',
      message: error.message
    });
  }
});

module.exports = router; 