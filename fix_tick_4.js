const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace(/Raw Data: \\\$\{localStorage/g, "Raw Data: ${localStorage");
fs.writeFileSync('index.html', content);
