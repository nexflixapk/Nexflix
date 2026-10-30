const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const oldLine = `resultsDiv.innerHTML = '<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4 w-full">' + Array(12).fill('<div class="w-full aspect-[2/3] bg-[#141414] animate-pulse rounded-sm"></div>').join('') + '</div>';`;

content = content.replace(oldLine, `// Skeleton removed to prevent UI flicker on every keystroke`);

fs.writeFileSync('index.html', content);
