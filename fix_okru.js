const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const hook = `
                let finalUrl = server.url;
                if (finalUrl.includes('<iframe')) {
                    const match = finalUrl.match(/src=["'](.*?)["']/);
                    if (match) finalUrl = match[1];
                }
                
                // Fix for ok.ru non-embed links
                if (finalUrl.includes('ok.ru/video/') && !finalUrl.includes('ok.ru/videoembed/')) {
                    finalUrl = finalUrl.replace('ok.ru/video/', 'ok.ru/videoembed/');
                }
`;

content = content.replace(
    /let finalUrl = server\.url;[\s\S]*?if \(match\) finalUrl = match\[1\];\s*\}/m,
    hook.trim()
);

fs.writeFileSync('index.html', content);
