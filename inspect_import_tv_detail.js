const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const sIdx = content.indexOf('window.importFromTMDB = async function');
console.log(content.substring(sIdx + 3000, sIdx + 6500));
