const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// I am going to completely revert the iframe section back to exactly how it was before my ok.ru "fixes"
const hook = `
                    iframe.setAttribute('allowfullscreen', 'true');
                    iframe.setAttribute('scrolling', 'no');
                    iframe.setAttribute('frameborder', '0');
                    // Ad-blocker: Sandbox prevents 3rd party popups and redirects
                    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-forms');
`;

content = content.replace(
    /iframe\.setAttribute\('allowfullscreen', 'true'\);[\s\S]*?\/\/ iframe\.setAttribute\('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-forms allow-popups'\);/m,
    hook.trim()
);

// I will also remove the ok.ru replacement that might be causing the URL to break
content = content.replace(
    /\/\/ Fix for ok\.ru non-embed links\s*if \(finalUrl\.includes\('ok\.ru\/video\/'\) && !finalUrl\.includes\('ok\.ru\/videoembed\/'\)\) \{\s*finalUrl = finalUrl\.replace\('ok\.ru\/video\/', 'ok\.ru\/videoembed\/'\);\s*\}/m,
    ""
);

fs.writeFileSync('index.html', content);
