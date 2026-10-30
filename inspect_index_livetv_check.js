const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

console.log(content.substring(115000, 116500));
