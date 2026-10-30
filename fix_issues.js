const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Fix search bar overlap
content = content.replace(
    /<div id="header-ad-container" class="w-full max-w-7xl mx-auto px-4 pt-20 text-center empty:hidden"><\/div>\s*<div class="pt-6 md:pt-16 px-4 md:px-12/g,
    '<div id="header-ad-container" class="w-full max-w-7xl mx-auto px-4 pt-28 md:pt-36 text-center empty:hidden"></div>\\n                <div class="pt-24 md:pt-32 px-4 md:px-12'
);

// Remove theboss@nexflix.com (probably what they meant by Admin id)
content = content.replace(
    /<p class="text-gray-400 mb-6">theboss@nexflix\.com<\/p>/g,
    ''
);

fs.writeFileSync('index.html', content);
