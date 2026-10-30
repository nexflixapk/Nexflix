const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const sIdx = content.indexOf('window.saveMovie = async function');
console.log(content.substring(sIdx, sIdx + 4000));
