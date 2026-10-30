const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

code = code.replace(/onclick="document\.getElementById\('search-input'\)\.value='([^']+)'; window\.location\.hash='#search'; setTimeout\(\(\)=>executeSearch\('[^']+'\), 200\);"/g, 
    "onclick=\"window.savedSearchState.query='$1'; window.location.hash='#search';\"");

fs.writeFileSync('index.html', code);
