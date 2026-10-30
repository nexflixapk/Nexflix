const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const hook = `
                // Check if it has required fields
                if (c.type === 'tv') {
                    if (c.season == null || c.episode == null || String(c.season) === 'undefined' || String(c.episode) === 'undefined' || String(c.episode).trim() === '') {
                        isValid = false;
                    } else if (!rawTvShows[c.id]) {
                        isValid = false; // TV show doesn't exist in DB
                    }
                } else if (c.type === 'movie') {
`;

content = content.replace(
    /\/\/ Check if it has required fields[\s\S]*?\} else if \(c\.type === 'movie'\) \{/m,
    hook.trim() + " {"
);

fs.writeFileSync('index.html', content);
