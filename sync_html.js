const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'index.html');
const content = fs.readFileSync(src, 'utf8');

const targets = [
  path.join(__dirname, 'dist', 'index.html'),
  path.join(__dirname, 'frontend', 'index.html'),
  path.join(__dirname, 'frontend', 'dist', 'index.html'),
  path.join(__dirname, 'frontend', 'prototype.html')
];

targets.forEach(t => {
  try {
    if (fs.existsSync(path.dirname(t))) {
      fs.writeFileSync(t, content);
      console.log('Synced to', t);
    }
  } catch (e) {}
});
