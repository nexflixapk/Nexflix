const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const hook = `
            // Continue Watching
            let cw = []; try { cw = JSON.parse(localStorage.getItem('nexora_continue_watching') || '[]'); } catch(e) {}
            // Clean up corrupted entries and validate against actual data
            const validCw = [];
            let hasChanges = false;
            
            cw.forEach(c => {
                let isValid = true;
                
                // Check if it has required fields
                if (c.type === 'tv') {
                    if (!c.season || !c.episode || String(c.season) === 'undefined' || String(c.episode) === 'undefined' || String(c.episode).trim() === '') {
                        isValid = false;
                    } else if (!tvShows[c.id]) {
                        isValid = false; // TV show doesn't exist in DB
                    }
                } else if (c.type === 'movie') {
                    if (!movies[c.id]) {
                        isValid = false; // Movie doesn't exist in DB (might be a TV show wrongly saved as movie)
                    }
                } else {
                    isValid = false;
                }
                
                if (isValid) {
                    validCw.push(c);
                } else {
                    hasChanges = true;
                }
            });
            
            cw = validCw;
            if (hasChanges) {
                localStorage.setItem('nexora_continue_watching', JSON.stringify(cw));
            }
`;

content = content.replace(
    /\/\/ Continue Watching\s*let cw = \[\]; try \{ cw = JSON\.parse\(localStorage\.getItem\('nexora_continue_watching'\) \|\| '\[\]'\); \} catch\(e\) \{\}\s*\/\/ Clean up corrupted TV show entries[\s\S]*?cw = cw\.filter\(c => c\.type === 'movie' \|\| \(c\.type === 'tv' && c\.season && c\.episode && String\(c\.season\) !== 'undefined' && String\(c\.episode\) !== 'undefined' && String\(c\.episode\)\.trim\(\) !== ''\)\);\s*localStorage\.setItem\('nexora_continue_watching', JSON\.stringify\(cw\)\); \/\/ Force clean save/m,
    hook.trim()
);

// Fallback regex if the above fails
if (content.includes('// Force clean save')) {
    console.log('Regex matched');
} else {
    // Try simpler regex
    content = content.replace(
        /\/\/ Continue Watching[\s\S]*?localStorage\.setItem\('nexora_continue_watching', JSON\.stringify\(cw\)\); \/\/ Force clean save/m,
        hook.trim()
    );
}

fs.writeFileSync('index.html', content);
