const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

console.log('=== ADMIN Live TV settings around 69500 ===');
console.log(content.substring(69500, 71500));

console.log('=== ADMIN saveSettings around 76000 ===');
console.log(content.substring(76000, 80000));
