const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const sIdx = content.indexOf('window.openTVEditor = function');
console.log('openTVEditor pos:', sIdx);
console.log(content.substring(sIdx, sIdx + 1200));
