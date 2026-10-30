const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace(/\\\`\\\$\{itemDetails\.title\}/g, "`${itemDetails.title}");
content = content.replace(/currentEpisode\}\)\\\`/g, "currentEpisode})`");
fs.writeFileSync('index.html', content);
