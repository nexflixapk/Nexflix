const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const hook = `
            if(servers.length === 0) {
                // Auto-clean from CW if deleted from DB
                if (!itemDetails) {
                    try {
                        let cw = JSON.parse(localStorage.getItem('nexora_continue_watching') || '[]');
                        cw = cw.filter(c => !(String(c.id) === String(id) && c.type === type));
                        localStorage.setItem('nexora_continue_watching', JSON.stringify(cw));
                    } catch(e) {}
                }
                console.log('No servers for', type, id, season, episode, itemDetails);
`;

content = content.replace(
    /if\(servers\.length === 0\) \{\s*console\.log\('No servers for', type, id, season, episode, itemDetails\);/m,
    hook.trim()
);

fs.writeFileSync('index.html', content);
