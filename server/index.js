const express = require('express');
const fs = require('fs').promises;
const fsSync = require('fs'); // Regular fs module for streaming
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const PREFS_DIR = path.join(__dirname, 'preferences');
const PDF_BASE_PATH = path.join(__dirname, 'documents', 'output');
const USE_ABSOLUTE_PATHS = process.env.USE_ABSOLUTE_PATHS === 'true' || false;

// Ensure preferences directory exists
async function ensurePrefsDir() {
  try {
    await fs.access(PREFS_DIR);
  } catch {
    await fs.mkdir(PREFS_DIR, { recursive: true });
  }
}

// Save display preferences
app.post('/api/save-display-preferences', async (req, res) => {
  try {
    await ensurePrefsDir();
    const { sectionCode, pdfFilename, tabType, ...preferences } = req.body;
    
    if (!sectionCode || !pdfFilename || !tabType) {
      return res.status(400).json({ 
        error: 'Section code, PDF filename, and tab type are required' 
      });
    }

    // Remove .pdf extension if present
    const baseFilename = pdfFilename.replace(/\.pdf$/, '');
    
    // Create filename based on the format: PDFFileName_SectionCode_type
    const prefsFilename = `${baseFilename}_${sectionCode}_${tabType}.json`;
    const filePath = path.join(PREFS_DIR, prefsFilename);
    
    console.log('Saving preferences to:', filePath);
    await fs.writeFile(filePath, JSON.stringify(preferences, null, 2));
    
    res.json({ success: true, filename: prefsFilename });
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// Load display preferences
app.get('/api/display-preferences', async (req, res) => {
  try {
    await ensurePrefsDir();
    const { pdfFilename, sectionCode, tabType } = req.query;
    
    if (!pdfFilename || !sectionCode || !tabType) {
      return res.status(400).json({ 
        error: 'PDF filename, section code, and tab type are required' 
      });
    }

    // Remove .pdf extension if present
    const baseFilename = pdfFilename.replace(/\.pdf$/, '');
    
    // Create filename based on the format: PDFFileName_SectionCode_type
    const prefsFilename = `${baseFilename}_${sectionCode}_${tabType}.json`;
    const filePath = path.join(PREFS_DIR, prefsFilename);
    
    console.log('Loading preferences from:', filePath);
    
    try {
      const data = await fs.readFile(filePath, 'utf8');
      res.json(JSON.parse(data));
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist - return empty preferences
        res.json({});
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error loading preferences:', error);
    res.status(500).json({ error: 'Failed to load preferences' });
  }
});

// Add these API endpoints to your existing server file

// API endpoint to get folders
app.get('/api/folders', async (req, res) => {
  try {
    const relativePath = req.query.path || '/documents/output';
    // Remove the leading slash if present to prevent double slashes
    const normalizedPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
    const fullPath = path.join(__dirname, normalizedPath);
    
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
app.get('/api/files', async (req, res) => {
  try {
    const relativePath = req.query.path || '/documents/output';
    console.log('Raw path received:', relativePath);
    
    // Decode the URL-encoded path
    const decodedPath = decodeURIComponent(relativePath);
    console.log('Decoded path:', decodedPath);
    
    // Remove the leading slash if present to prevent double slashes
    const normalizedPath = decodedPath.startsWith('/') ? decodedPath.substring(1) : decodedPath;
    console.log('Normalized path:', normalizedPath);
    
    const fullPath = path.join(__dirname, normalizedPath);
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

// API endpoint to serve PDF files
app.get('/api/pdf', async (req, res) => {
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
app.get('/api/test-pdf', (req, res) => {
  console.log('Test PDF endpoint called');
  
  // Redirect to a public PDF - this is a Google Chrome PDF viewer test file
  res.redirect('https://storage.googleapis.com/chrome-devrel-public/pdf/hello.pdf');
});

// Helper function to extract section code
const extractSectionCode = (filename, isEnhanced = false) => {
  console.log('Extracting section code from:', filename, 'isEnhanced:', isEnhanced);
  
  if (isEnhanced) {
    // For enhanced JSONs: "<filename>_<sectionCode>.json_enhanced.json"
    const match = filename.match(/_((?:ENR|AD|GEN|AMDT)_\d+(?:_\d+)?)/i);
    console.log('Enhanced match:', match);
    return match ? match[1] : 'Unknown';
  } else {
    // For parsed JSONs: "<filename>_<sectionCode>.json"
    const match = filename.match(/_((?:ENR|AD|GEN|AMDT)_\d+(?:_\d+)?)/i);
    console.log('Parsed match:', match);
    return match ? match[1] : 'Unknown';
  }
};

// API endpoint to get parsed JSON files associated with a PDF
app.get('/api/parsed-jsons', async (req, res) => {
  console.log('\n=== PARSED JSONS API CALL ===');
  console.log('Query parameters:', req.query);
  
  try {
    const { folderPath, pdfFilename } = req.query;
    
    if (!folderPath || !pdfFilename) {
      console.log('❌ Missing required parameters');
      return res.status(400).json({ error: 'Both folderPath and pdfFilename are required' });
    }
    
    // Build the correct path to include documents directory
    const jsonFolderPath = path.join(PDF_BASE_PATH, folderPath, 'parsed_jsons');
    console.log('Looking in folder:', jsonFolderPath);
    
    // Remove file extension from PDF filename
    const baseFilename = pdfFilename.replace(/\.pdf$/i, '');
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
        const matches = file.startsWith(baseFilename + '_') && file.endsWith('.json');
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
app.get('/api/enhanced-jsons', async (req, res) => {
  console.log('\n=== ENHANCED JSONS API CALL ===');
  console.log('Query parameters:', req.query);
  
  try {
    const { folderPath, pdfFilename } = req.query;
    
    if (!folderPath || !pdfFilename) {
      console.log('❌ Missing required parameters');
      return res.status(400).json({ error: 'Both folderPath and pdfFilename are required' });
    }
    
    // Build the correct path to include documents directory
    const jsonFolderPath = path.join(PDF_BASE_PATH, folderPath, 'enhanced_jsons');
    console.log('Looking in folder:', jsonFolderPath);
    
    // Remove file extension from PDF filename
    const baseFilename = pdfFilename.replace(/\.pdf$/i, '');
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
        const matches = file.startsWith(baseFilename + '_') && file.endsWith('_enhanced.json');
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
app.get('/api/process-json', async (req, res) => {
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
    const fullPath = path.join(PDF_BASE_PATH, filePath);
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

// Add new endpoint to get basic HTML content
app.get('/api/basic-html', async (req, res) => {
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

// Fix for the HTML endpoint - replace lines 494-512 with this code:
app.get('/api/html', (req, res) => {
  console.log('\n=== 📄 HTML API CALL ===');
  console.log('Query parameters:', req.query);
  
  const { folder, subFolder, file } = req.query;
  
  if (!folder || !subFolder || !file) {
    console.log('❌ Missing required parameters');
    return res.status(400).json({ 
      error: 'folder, subFolder, and file parameters are all required' 
    });
  }
  
  // Use PDF_BASE_PATH instead of undefined basePath
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Check if documents directory exists
  const docsPath = path.join(__dirname, 'documents/output');
  fs.access(docsPath)
    .then(() => {
      console.log(`✅ Documents directory exists: ${docsPath}`);
    })
    .catch((err) => {
      console.error(`❌ Documents directory NOT FOUND: ${docsPath}`);
      console.error('Error:', err.message);
      console.log('You may need to create this directory or adjust the server paths');
    });
});