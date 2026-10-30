const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

const pos = content.indexOf('window.generateLiveTvRow = function');
console.log('generateLiveTvRow pos:', pos);
console.log(content.substring(pos, pos + 1200));
