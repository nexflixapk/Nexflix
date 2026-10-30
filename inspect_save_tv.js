const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

console.log('=== saveTV around 183000 to 190000 ===');
console.log(content.substring(183000, 190000));
