const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const pos = content.indexOf('addMovieServer');
console.log('addMovieServer pos:', pos);
console.log(content.substring(pos - 100, pos + 2500));
