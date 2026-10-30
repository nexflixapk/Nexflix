const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

console.log(content.substring(282200, 283500));
