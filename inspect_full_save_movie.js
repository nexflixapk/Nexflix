const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

console.log(content.substring(172850, 178500));
