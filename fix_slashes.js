const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// The corrupted backticks are \` instead of ` inside the template literals of renderNetwork.
// Let's just find them and replace them.
code = code.replace(/\\\`<img src=/g, '`<img src=');
code = code.replace(/\\\` : \\\`<div class=/g, '` : `<div class=');
code = code.replace(/<\/div>\\\`}/g, '</div>`}');

fs.writeFileSync('index.html', code);
