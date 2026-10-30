const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

console.log('=== TV Seasons and Episodes Logic (202000 - 208000) ===');
console.log(content.substring(202000, 208000));
