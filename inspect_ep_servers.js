const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

console.log('=== Episode Servers Logic (208500 to 215000) ===');
console.log(content.substring(208500, 215000));
