const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

console.log('=== Around 176000 to 183000 ===');
console.log(content.substring(176000, 183000));
