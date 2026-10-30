const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const hook = `
                // Check if it has required fields
                if (c.type === 'tv') {
                    if (c.season == null || c.episode == null || String(c.season) === 'undefined' || String(c.episode) === 'undefined' || String(c.episode).trim() === '') {
                        isValid = false;
                    }
                } else if (c.type === 'movie') {
                    // Movie is always valid structurally
                } else {
                    isValid = false;
                }
`;

content = content.replace(
    /\/\/ Check if it has required fields[\s\S]*?\} else \{[\s\S]*?isValid = false;\s*\}/m,
    hook.trim()
);

fs.writeFileSync('index.html', content);
