const fs = require('fs').promises;
const fsSync = require('fs');
const config = require('../config/config');

// Ensure preferences directory exists
async function ensurePrefsDir() {
  try {
    await fs.access(config.PATHS.PREFS_DIR);
  } catch {
    await fs.mkdir(config.PATHS.PREFS_DIR, { recursive: true });
  }
}

// Extract section code from a filename
const extractSectionCode = (filename, isEnhanced = false) => {
  console.log('Extracting section code from:', filename, 'isEnhanced:', isEnhanced);
  
  if (isEnhanced) {
    // For enhanced JSONs: "<filename>_<sectionCode>.json_enhanced.json"
    const match = filename.match(config.FILES.PATTERNS.SECTION_CODE_REGEX);
    console.log('Enhanced match:', match);
    return match ? match[1] : 'Unknown';
  } else {
    // For parsed JSONs: "<filename>_<sectionCode>.json"
    const match = filename.match(config.FILES.PATTERNS.SECTION_CODE_REGEX);
    console.log('Parsed match:', match);
    return match ? match[1] : 'Unknown';
  }
};

module.exports = {
  ensurePrefsDir,
  extractSectionCode,
  fsSync
}; 