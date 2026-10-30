const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetJS = `            // Hide splash screen smoothly
            const splash = document.getElementById('netflix-splash');
            if (splash) {
                setTimeout(() => {
                    splash.style.opacity = '0';
                    setTimeout(() => splash.remove(), 1000);
                }, 1000);
            }`;
code = code.replace(targetJS, '');

fs.writeFileSync('index.html', code);
