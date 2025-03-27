const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const config = require('./src/config/config');

// Import route modules
const preferencesRoutes = require('./src/routes/preferences');
const filesystemRoutes = require('./src/routes/filesystem');
const pdfRoutes = require('./src/routes/pdf');
const jsonRoutes = require('./src/routes/json');
const htmlRoutes = require('./src/routes/html');

const app = express();
const PORT = config.SERVER.PORT;

// Middleware
app.use(cors({
  origin: config.SERVER.CORS.ORIGIN,
  methods: config.SERVER.CORS.METHODS,
  allowedHeaders: config.SERVER.CORS.ALLOWED_HEADERS
}));
app.use(express.json());

// Register route modules
app.use(config.API.PREFIX, preferencesRoutes);
app.use(config.API.PREFIX, filesystemRoutes);
app.use(config.API.PREFIX, pdfRoutes);
app.use(config.API.PREFIX, jsonRoutes);
app.use(config.API.PREFIX, htmlRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Check if documents directory exists
  const docsPath = config.PATHS.PDF_BASE_PATH;
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