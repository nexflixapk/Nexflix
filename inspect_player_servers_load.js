const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

const pPos = content.indexOf('function renderPlayer');
console.log(content.substring(pPos, pPos + 1800));
