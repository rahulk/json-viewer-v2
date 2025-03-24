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
const PDF_BASE_PATH = process.env.PDF_BASE_PATH || path.join(__dirname, 'documents/output');
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
    const { sectionCode, ...preferences } = req.body;
    
    if (!sectionCode) {
      return res.status(400).json({ error: 'Section code is required' });
    }

    const filePath = path.join(PREFS_DIR, `${sectionCode}.json`);
    await fs.writeFile(filePath, JSON.stringify(preferences, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// Load display preferences
app.get('/api/display-preferences/:sectionCode', async (req, res) => {
  try {
    await ensurePrefsDir();
    const { sectionCode } = req.params;
    const filePath = path.join(PREFS_DIR, `${sectionCode}.json`);
    
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
  console.log('Request URL:', req.url);
  console.log('Request query:', req.query);
  
  try {
    const relativePath = req.query.path || '';
    console.log('===== PDF REQUEST DEBUGGING =====');
    console.log('Raw PDF path received:', relativePath);
    console.log('Path character count:', relativePath.length);
    
    // Print each character code to debug space issues
    console.log('Path character codes:');
    const charCodes = [...relativePath].map(c => c.charCodeAt(0));
    console.log(charCodes.join(', '));
    
    // Decode the URL-encoded path
    const decodedPath = decodeURIComponent(relativePath);
    console.log('Decoded PDF path:', decodedPath);
    console.log('Decoded path character count:', decodedPath.length);
    
    // Print decoded character codes
    console.log('Decoded character codes:');
    const decodedCharCodes = [...decodedPath].map(c => c.charCodeAt(0));
    console.log(decodedCharCodes.join(', '));
    
    let fullPath;
    
    if (USE_ABSOLUTE_PATHS) {
      // Use the full path directly (for testing)
      fullPath = decodedPath.replace(/^\/documents\/output/, PDF_BASE_PATH);
      console.log('Using absolute path mode');
    } else {
      // Remove the leading slash if present to prevent double slashes
      const normalizedPath = decodedPath.startsWith('/') ? decodedPath.substring(1) : decodedPath;
      console.log('Normalized PDF path:', normalizedPath);
      
      fullPath = path.join(__dirname, normalizedPath);
    }
    
    console.log('ABSOLUTE server file path:', fullPath);
    console.log('Server __dirname:', __dirname);
    console.log('PDF_BASE_PATH:', PDF_BASE_PATH);
    
    // Detailed log to compare with actual filesystem paths
    console.log('\nPath structure breakdown:');
    const pathSegments = decodedPath.split('/').filter(Boolean);
    pathSegments.forEach((segment, i) => {
      console.log(`  Segment ${i+1}: "${segment}" (${segment.length} chars)`);
    });
    console.log('===== END DEBUGGING =====');
    
    // Check if the file exists
    try {
      await fs.access(fullPath);
      console.log('✅ PDF FILE EXISTS:', fullPath);
    } catch (error) {
      console.error('❌ PDF FILE NOT FOUND:', fullPath);
      
      // Try to list the containing directory to see what's actually there
      try {
        const parentDir = path.dirname(fullPath);
        console.log('Checking parent directory:', parentDir);
        const items = await fs.readdir(parentDir, { withFileTypes: true });
        const files = items.filter(item => item.isFile()).map(item => item.name);
        console.log('Files in parent directory:', files);
      } catch (dirError) {
        console.error('Parent directory does not exist or cannot be read:', dirError.message);
      }
      
      // Explicitly set content type to JSON to prevent browser from trying to render HTML
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ 
        error: 'PDF file not found',
        path: fullPath,
        message: error.message 
      });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'application/pdf');
    const filename = path.basename(fullPath);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(filename)}"`);
    console.log('Serving PDF file:', filename);
    
    // Create a read stream and pipe it to the response
    const fileStream = fsSync.createReadStream(fullPath);
    
    // Handle stream errors
    fileStream.on('error', (streamError) => {
      console.error('Stream error:', streamError);
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ error: 'Error streaming PDF file', message: streamError.message });
      }
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error serving PDF:', error);
    // Explicitly set content type to JSON to prevent browser from trying to render HTML
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({ error: 'Failed to serve PDF', message: error.message });
  }
});

// Add a test PDF endpoint that always works
app.get('/api/test-pdf', (req, res) => {
  console.log('Test PDF endpoint called');
  
  // Redirect to a public PDF - this is a Google Chrome PDF viewer test file
  res.redirect('https://storage.googleapis.com/chrome-devrel-public/pdf/hello.pdf');
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