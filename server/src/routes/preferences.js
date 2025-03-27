const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { PREFS_DIR } = require('../config/constants');
const { ensurePrefsDir } = require('../utils/fileUtils');

// Save display preferences
router.post('/save-display-preferences', async (req, res) => {
  console.log('\n=== 💾 SAVE DISPLAY PREFERENCES ===');
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  try {
    await ensurePrefsDir();
    const { sectionCode, pdfFilename, tabType, ...preferences } = req.body;
    
    console.log('📝 Request Details:', {
      sectionCode,
      pdfFilename,
      tabType,
      preferencesKeys: Object.keys(preferences)
    });
    
    if (!sectionCode || !pdfFilename || !tabType) {
      console.log('❌ Missing required parameters');
      return res.status(400).json({ 
        error: 'Section code, PDF filename, and tab type are required' 
      });
    }

    // Remove .pdf extension if present
    const baseFilename = pdfFilename.replace(/\.pdf$/, '');
    
    // Create filename based on the format: PDFFileName_SectionCode_type
    const prefsFilename = `${baseFilename}_${sectionCode}_${tabType}.json`;
    const filePath = path.join(PREFS_DIR, prefsFilename);
    
    console.log('💾 Saving preferences to:');
    console.log('📂 Absolute path:', filePath);
    console.log('📄 Filename:', prefsFilename);
    
    // Log the preferences being saved
    console.log('🔍 Preferences content:', {
      selectedColumns: preferences.selectedColumns?.length || 0,
      columnWidths: Object.keys(preferences.columnWidths || {}).length || 0
    });
    
    await fs.writeFile(filePath, JSON.stringify(preferences, null, 2));
    console.log('✅ Successfully saved preferences file');
    
    res.json({ success: true, filename: prefsFilename });
    console.log('=== END SAVE DISPLAY PREFERENCES ===\n');
  } catch (error) {
    console.error('❌ Error saving preferences:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

// Load display preferences
router.get('/display-preferences', async (req, res) => {
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

// Add another route to handle the format used by FlatDataTable
router.get('/display-preferences/:sectionCode', async (req, res) => {
  try {
    await ensurePrefsDir();
    const sectionCode = req.params.sectionCode;
    
    if (!sectionCode) {
      return res.status(400).json({ 
        error: 'Section code is required' 
      });
    }

    console.log('Looking for preferences with section code:', sectionCode);
    
    // List all preferences files
    const files = await fs.readdir(PREFS_DIR);
    
    // Find any file that contains the section code
    const matchingFiles = files.filter(file => file.includes(sectionCode));
    
    if (matchingFiles.length === 0) {
      // No matching file found
      console.log('No preferences found for section code:', sectionCode);
      return res.json({});
    }
    
    // Use the first matching file
    const filePath = path.join(PREFS_DIR, matchingFiles[0]);
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
    console.error('Error loading preferences by section code:', error);
    res.status(500).json({ error: 'Failed to load preferences' });
  }
});

module.exports = router; 