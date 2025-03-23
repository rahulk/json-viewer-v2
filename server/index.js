const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const PREFS_DIR = path.join(__dirname, 'preferences');

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 