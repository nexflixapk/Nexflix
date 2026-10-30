const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(/` : \\\`<span/g, '` : `<span');

fs.writeFileSync('index.html', code);
