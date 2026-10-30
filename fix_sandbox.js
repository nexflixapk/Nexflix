const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(
    /iframe\.setAttribute\('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-forms'\);/g,
    ""
);

fs.writeFileSync('index.html', content);
