/**
 * Application Configuration
 * 
 * Central configuration file to store all environment-specific and
 * application-wide settings. Values can be overridden using environment 
 * variables for easy deployment across different environments.
 */

/**
 * API related configuration
 */
const API = {
  // Base URL for API endpoints
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  
  // API endpoints
  ENDPOINTS: {
    FOLDERS: '/api/folders',
    FILES: '/api/files',
    BASIC_HTML: '/api/basic-html',
    PARSED_JSONS: '/api/parsed-jsons',
    ENHANCED_JSONS: '/api/enhanced-jsons',
    HTML: '/api/html',
    PDF: '/api/pdf'
  }
};

/**
 * File paths and patterns
 */
const PATHS = {
  // Default document output directory
  DOCUMENTS_OUTPUT: '/documents/output',
  
  // File patterns and extensions
  FILE_EXTENSIONS: {
    PDF: '.pdf',
    HTML: '.html',
    ENHANCED_HTML_SUFFIX: '_enhanced.html',
    MODIFIED_HTML_SUFFIX: '_modified.html',
    FILTERED_HTML_SUFFIX: '_filtered.html'
  },
  
  // Subfolder names
  SUBFOLDERS: {
    ENHANCED_HTML: 'enhanced_html',
    MODIFIED_HTML: 'modified_html',
    FILTERED_HTML: 'filtered_html',
    WORD_FILES: 'word_files'
  }
};

/**
 * Tab-related configuration
 */
const TABS = {
  // Tab indices
  INDICES: {
    BASIC_HTML: 0,
    ENHANCED_HTML: 1,
    MODIFIED_HTML: 2,
    PARSED_JSON: 3,
    ENHANCED_JSON: 4
  },
  
  // Default selected tab
  DEFAULT_SELECTED: 0,
  
  // Tab labels (can be used for rendering)
  LABELS: [
    'Basic HTML',
    'Enhanced HTML',
    'Modified HTML',
    'Parsed JSONs',
    'Enhanced JSONs'
  ]
};

/**
 * UI-related configuration
 */
const UI = {
  // Default styles
  STYLES: {
    CONTENT_CONTAINER: {
      height: '100%',
      overflow: 'visible'
    }
  },
  
  // Feature flags
  FEATURES: {
    // Whether to enable color highlighting for enhanced JSONs
    ENABLE_COLOR_HIGHLIGHTING_FOR_ENHANCED: true,
    
    // Whether to enable color highlighting for parsed JSONs
    ENABLE_COLOR_HIGHLIGHTING_FOR_PARSED: false,
    
    // Debug logging level
    DEBUG_LEVEL: process.env.REACT_APP_DEBUG_LEVEL || 'info'
  }
};

// Export all configuration sections
export const config = {
  API,
  PATHS,
  TABS,
  UI
};

// Default export for easier imports
export default config; 