/**
 * Constants file for backward compatibility
 * 
 * This file provides backward compatibility with existing code that uses
 * constants.js imports. It simply re-exports values from the config file.
 */

const config = require('./config');

// Re-export existing constants for backward compatibility
module.exports = {
  PREFS_DIR: config.PATHS.PREFS_DIR,
  PDF_BASE_PATH: config.PATHS.PDF_BASE_PATH,
  USE_ABSOLUTE_PATHS: process.env.USE_ABSOLUTE_PATHS === 'true' || false
}; 