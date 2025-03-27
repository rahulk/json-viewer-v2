const path = require('path');

// Define constants used throughout the application
module.exports = {
  PREFS_DIR: path.join(__dirname, '../../preferences'),
  PDF_BASE_PATH: path.join(__dirname, '../../documents/output'),
  USE_ABSOLUTE_PATHS: process.env.USE_ABSOLUTE_PATHS === 'true' || false
}; 