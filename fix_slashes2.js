const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(/transition-opacity">\\\`/g, 'transition-opacity">`');
code = code.replace(/\\\` : \\\`<span/g, '` : `<span');
code = code.replace(/<\/span>\\\`}/g, '</span>`}');

fs.writeFileSync('index.html', code);
