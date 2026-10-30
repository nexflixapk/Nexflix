const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const pos = content.indexOf('id="tv-modal"');
console.log('tv-modal pos:', pos);
console.log(content.substring(pos, pos + 4000));
