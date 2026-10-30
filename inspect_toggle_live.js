const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

console.log('=== toggleLiveTvFromAdmin and saveSettings (57000 to 65000) ===');
console.log(content.substring(57000, 65000));
