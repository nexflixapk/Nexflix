const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const pos = content.indexOf('window.editMovie = function');
console.log(content.substring(pos + 1200, pos + 2800));
