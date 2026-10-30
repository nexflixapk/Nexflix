const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(/appContent\.innerHTML = \\`\<div/g, "appContent.innerHTML = `<div");
content = content.replace(/Go Back\<\/a>\<\/div>\\`;/g, "Go Back</a></div>`;");

fs.writeFileSync('index.html', content);
