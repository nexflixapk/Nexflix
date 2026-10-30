const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace(/S\\\$\{currentSeason\}/g, "S${currentSeason}");
content = content.replace(/E\\\$\{typeof/g, "E${typeof");
fs.writeFileSync('index.html', content);
