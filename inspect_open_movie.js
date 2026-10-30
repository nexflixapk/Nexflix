const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const pos = content.indexOf('window.openMovieEditor');
console.log('openMovieEditor pos:', pos);
console.log(content.substring(pos, pos + 2500));
