const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// The logic inside executeSearch needs to match the network query.
// Currently it matches by title, genres, etc. Let's see what it matches.
