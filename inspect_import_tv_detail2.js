const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const sIdx = content.indexOf('window.importFromTMDB = async function');
console.log(content.substring(sIdx + 6500, sIdx + 9500));
