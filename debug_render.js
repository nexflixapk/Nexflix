const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
const match = content.match(/\/\/ Continue Watching([\s\S]*?)\/\/ Because you watched/);
console.log(match ? match[1] : "NOT FOUND");
