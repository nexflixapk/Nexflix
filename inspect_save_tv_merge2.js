const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const sIdx = content.indexOf('window.saveTV = async function');
console.log(content.substring(sIdx + 5000, sIdx + 7500));
