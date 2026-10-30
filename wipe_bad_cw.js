const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const hook = `
            // Clean up corrupted TV show entries
            cw = cw.filter(c => c.type === 'movie' || (c.type === 'tv' && c.season && c.episode && String(c.season) !== 'undefined' && String(c.episode) !== 'undefined' && String(c.episode).trim() !== ''));
            localStorage.setItem('nexora_continue_watching', JSON.stringify(cw)); // Force clean save
`;

content = content.replace(
    /\/\/ Clean up corrupted TV show entries\s*cw = cw\.filter\(c => c\.type === 'movie' \|\| \(c\.type === 'tv' && c\.season && c\.episode && String\(c\.episode\) !== 'undefined' && String\(c\.episode\)\.trim\(\) !== ''\)\);/m,
    hook.trim()
);

fs.writeFileSync('index.html', content);
