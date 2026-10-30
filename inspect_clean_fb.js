const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

const pos = content.indexOf('function cleanFirebaseData');
console.log('cleanFirebaseData pos:', pos);
console.log(content.substring(pos, pos + 1000));
