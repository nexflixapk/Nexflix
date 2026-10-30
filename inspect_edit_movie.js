const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const pos = content.indexOf('window.editMovie = function');
console.log('editMovie pos:', pos);
console.log(content.substring(pos, pos + 2500));
