/**
 * Server Configuration
 * 
 * Central configuration file to store all environment-specific and
 * application-wide settings. Values can be overridden using environment 
 * variables for easy deployment across different environments.
 */
const path = require('path');

/**
 * Paths and directories
 */
const PATHS = {
  // Base paths
  BASE_DIR: path.join(__dirname, '../../'),
  PREFS_DIR: process.env.PREFS_DIR || path.join(__dirname, '../../preferences'),
  PDF_BASE_PATH: process.env.PDF_BASE_PATH || path.join(__dirname, '../../documents/output'),
  
  // Default paths
  DEFAULT_DOCUMENTS_PATH: process.env.DEFAULT_DOCUMENTS_PATH || '/documents/output',

  // Subfolder names
  SUBFOLDERS: {
    PARSED_JSONS: 'parsed_jsons',
    ENHANCED_JSONS: 'enhanced_jsons',
    BASIC_HTML: 'basic_html',
    ENHANCED_HTML: 'enhanced_html',
    MODIFIED_HTML: 'modified_html',
    FILTERED_HTML: 'filtered_html',
    WORD_FILES: 'word_files'
  }
};

/**
 * File naming and patterns
 */
const FILES = {
  // File extensions
  EXTENSIONS: {
    PDF: '.pdf',
    HTML: '.html',
    JSON: '.json',
    ENHANCED_JSON_SUFFIX: '_enhanced.json'
  },
  
  // Regex patterns
  PATTERNS: {
    SECTION_CODE_REGEX: /_((?:ENR|AD|GEN|AMDT)_\d+(?:_\d+)?)/i,
    SECTION_CODE_TYPES: ['ENR', 'AD', 'GEN', 'AMDT']
  },
  
  // File naming conventions
  NAMING: {
    PREFS_FILENAME_FORMAT: '{baseFilename}_{sectionCode}_{tabType}.json'
  }
};

/**
 * Server settings
 */
const SERVER = {
  PORT: process.env.PORT || 3001,
  
  // CORS options
  CORS: {
    ORIGIN: process.env.CORS_ORIGIN || '*',
    METHODS: ['GET', 'POST', 'PUT', 'DELETE'],
    ALLOWED_HEADERS: ['Content-Type', 'Authorization']
  },
  
  // External resources
  EXTERNAL: {
    TEST_PDF_URL: 'https://storage.googleapis.com/chrome-devrel-public/pdf/hello.pdf'
  }
};

/**
 * API endpoints
 */
const API = {
  PREFIX: '/api',
  
  ENDPOINTS: {
    FOLDERS: '/folders',
    FILES: '/files',
    BASIC_HTML: '/basic-html',
    PARSED_JSONS: '/parsed-jsons',
    ENHANCED_JSONS: '/enhanced-jsons',
    HTML: '/html',
    PDF: '/pdf',
    TEST_PDF: '/test-pdf',
    PROCESS_JSON: '/process-json',
    SAVE_DISPLAY_PREFERENCES: '/save-display-preferences',
    DISPLAY_PREFERENCES: '/display-preferences'
  }
};

// Export all configuration sections
const config = {
  PATHS,
  FILES,
  SERVER,
  API
};

module.exports = config; 