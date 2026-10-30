const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const hook = `
                        if (currentType === 'movie' || (currentType === 'tv' && currentSeason && currentEpisode)) {
`;

content = content.replace(
    /if \(currentType === 'movie' \|\| \(currentType === 'tv' && String\(currentSeason\) !== '' && String\(currentSeason\) !== 'undefined' && String\(currentEpisode\) !== '' && String\(currentEpisode\) !== 'undefined'\)\) \{/m,
    hook.trim()
);

const hook2 = `
                                                if (type === 'movie' || (type === 'tv' && season && episode)) {
`;

content = content.replace(
    /if \(type === 'movie' \|\| \(type === 'tv' && String\(season\) !== '' && String\(season\) !== 'undefined' && String\(episode\) !== '' && String\(episode\) !== 'undefined'\)\) \{/m,
    hook2.trim()
);

fs.writeFileSync('index.html', content);
