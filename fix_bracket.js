const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace(/\} else \{ \{/g, "} else {");
fs.writeFileSync('index.html', content);
