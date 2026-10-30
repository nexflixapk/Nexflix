const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(
    /initPlayer\(servers, itemDetails, epTitle\);/g,
    "initPlayer(servers, itemDetails, epTitle, id, type, season, episode, epNum);"
);

content = content.replace(
    /function initPlayer\(servers, itemDetails, epTitle\) \{/g,
    "function initPlayer(servers, itemDetails, epTitle, id, type, season, episode, epNum) {"
);

fs.writeFileSync('index.html', content);
