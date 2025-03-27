const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

// Import route modules
const preferencesRoutes = require('./src/routes/preferences');
const filesystemRoutes = require('./src/routes/filesystem');
const pdfRoutes = require('./src/routes/pdf');
const jsonRoutes = require('./src/routes/json');
const htmlRoutes = require('./src/routes/html');

// Import constants
const { PDF_BASE_PATH } = require('./src/config/constants');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Register route modules
app.use('/api', preferencesRoutes);
app.use('/api', filesystemRoutes);
app.use('/api', pdfRoutes);
app.use('/api', jsonRoutes);
app.use('/api', htmlRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Check if documents directory exists
  const docsPath = PDF_BASE_PATH;
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