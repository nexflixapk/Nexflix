const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const hook = `
            // Continue Watching
            let cw = []; try { cw = JSON.parse(localStorage.getItem('nexora_continue_watching') || '[]'); } catch(e) {}
`;

content = content.replace(
    /\/\/ Continue Watching[\s\S]*?cw = validCw;[\s\S]*?if \(hasChanges\) \{[\s\S]*?localStorage\.setItem\('nexora_continue_watching', JSON\.stringify\(cw\)\);\s*\}/m,
    hook.trim()
);

fs.writeFileSync('index.html', content);
