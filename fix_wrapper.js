const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(
    /else wrapper\.requestFullscreen\(\);/g,
    "else document.getElementById('video-wrapper').requestFullscreen();"
);

fs.writeFileSync('index.html', content);
