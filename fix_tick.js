const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace(/appContent\.innerHTML = \\`\<div/g, "appContent.innerHTML = `<div");
content = content.replace(/\<\/a>\n                \<\/div>\\`;/g, "</a>\n                </div>`;");
fs.writeFileSync('index.html', content);
