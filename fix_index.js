const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, 'index.html');
let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// Replace the inline onsubmit handler
indexHtml = indexHtml.replace(
  'onsubmit="handleFarmerListProduce(event)"',
  'onsubmit="handleFarmerListProduceAsync(event)"'
);

fs.writeFileSync(indexHtmlPath, indexHtml);
console.log('Successfully patched index.html inline onsubmit!');

const appJsPath = path.join(__dirname, 'app.js');
let appJs = fs.readFileSync(appJsPath, 'utf8');

// Make sure our patched function in app.js is named handleFarmerListProduceAsync
appJs = appJs.replace(
  'window.handleFarmerListProduce = async function(e)',
  'window.handleFarmerListProduceAsync = async function(e)'
);

fs.writeFileSync(appJsPath, appJs);
console.log('Successfully updated app.js function name!');
