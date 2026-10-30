const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const pos = content.indexOf('id="tv-modal"');
console.log(content.substring(pos + 9000, pos + 16000));
