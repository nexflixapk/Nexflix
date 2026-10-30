const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const hook = `
                // Fix: Ensure we correctly handle TV show links in CW
                let link = \`#\${item.type}/\${item.id}\`;
                if (item.isCw) {
                    if (item.type === 'tv' && item.season && item.episode) {
                        // Make absolutely sure it's valid, else fallback to just the show page
                        if(String(item.season) !== 'undefined' && String(item.episode) !== 'undefined') {
                            link = \`#watch/tv/\${item.id}/\${item.season}/\${item.episode}\`;
                        }
                    } else if (item.type === 'movie') {
                        link = \`#watch/movie/\${item.id}\`;
                    }
                }
`;

content = content.replace(
    /\/\/ Fix: Ensure we correctly handle TV show links in CW[\s\S]*?link = `#watch\/movie\/\$\{item\.id\}`;[\s\S]*?\}[\s\S]*?\}/m,
    hook.trim()
);

fs.writeFileSync('index.html', content);
