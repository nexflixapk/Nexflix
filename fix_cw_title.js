const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Fix fallback save
content = content.replace(
    /title: currentType === 'movie' \? itemDetails\.title : \`\$\{itemDetails\.title\} \(S\$\{currentSeason\}/g,
    "title: currentType === 'movie' ? (itemDetails.title || itemDetails.name) : `${itemDetails.title || itemDetails.name} (S${currentSeason}"
);

// Fix timeupdate save
content = content.replace(
    /title: type === 'movie' \? itemDetails\.title : \`\$\{itemDetails\.title\} \(S\$\{season\}/g,
    "title: type === 'movie' ? (itemDetails.title || itemDetails.name) : `${itemDetails.title || itemDetails.name} (S${season}"
);

// Make sure TV show title formatting works well
fs.writeFileSync('index.html', content);
