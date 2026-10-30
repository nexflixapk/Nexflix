const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace(/html \+= \\`\<div/g, "html += `<div");
content = content.replace(/\<\/div>\\`;/g, "</div>`;");
fs.writeFileSync('index.html', content);
