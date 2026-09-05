import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import app from './app.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const PORT = process.env.PORT || 5000;

// Serve Static Frontend Files for standalone local preview
app.use(express.static(rootDir));

// Root Frontend Route
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Fieldora Backend Server is running on http://localhost:${PORT}`);
});
