const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(
    /rounded-full px-6 py-2 md:py-3/g,
    'rounded-full px-4 md:px-6 py-2 md:py-3'
);

fs.writeFileSync('index.html', content);
