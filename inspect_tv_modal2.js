const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const pos = content.indexOf('id="tv-modal"');
console.log(content.substring(pos + 4000, pos + 9000));
