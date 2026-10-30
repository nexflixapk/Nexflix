const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const homeHeroBlockToReplace = `
            if (hero) {
                html += \`
                    <div id="home-hero"`;

const newHomeHeroBlock = `
            if (hero) {
                let heroWatchLink = \`#watch/\${hero.title ? 'movie' : 'tv'}/\${hero.id}\`;
                let heroPlayText = 'Play';
                try {
                    let cwList = JSON.parse(localStorage.getItem('nexora_continue_watching') || '[]');
                    let activeCw = cwList.find(c => c.id === hero.id && c.type === (hero.title ? 'movie' : 'tv'));
                    if (activeCw) {
                        heroPlayText = 'Resume';
                        if (activeCw.type === 'tv') {
                            heroWatchLink = \`#watch/tv/\${hero.id}/\${activeCw.season}/\${activeCw.episode}\`;
                        }
                    }
                } catch(e) {}
                
                html += \`
                    <div id="home-hero"`;

content = content.replace(
    homeHeroBlockToReplace,
    newHomeHeroBlock
);

// Replace the Play buttons inside the hero
// Desktop:
content = content.replace(
    '<a href="#watch/${hero.title ? \'movie\' : \'tv\'}/${hero.id}" class="bg-white text-black px-6 md:px-8 py-2 md:py-2.5 rounded flex items-center gap-2 font-bold hover:bg-white/80 transition text-base md:text-lg shadow-sm hover:scale-105 active:scale-95 duration-200">\n                                    <i class="fas fa-play text-xl"></i> <span>Play</span>',
    '<a href="${heroWatchLink}" class="bg-white text-black px-6 md:px-8 py-2 md:py-2.5 rounded flex items-center gap-2 font-bold hover:bg-white/80 transition text-base md:text-lg shadow-sm hover:scale-105 active:scale-95 duration-200">\n                                    <i class="fas fa-play text-xl"></i> <span>${heroPlayText}</span>'
);

// Mobile:
content = content.replace(
    '<a href="#watch/${hero.title ? \'movie\' : \'tv\'}/${hero.id}" class="bg-white text-black px-8 py-2 rounded-md flex items-center justify-center gap-2 font-bold hover:bg-white/80 transition-colors text-base shadow-sm">\n                                    <i class="fas fa-play text-lg"></i> <span>Play</span>',
    '<a href="${heroWatchLink}" class="bg-white text-black px-8 py-2 rounded-md flex items-center justify-center gap-2 font-bold hover:bg-white/80 transition-colors text-base shadow-sm">\n                                    <i class="fas fa-play text-lg"></i> <span>${heroPlayText}</span>'
);

fs.writeFileSync('index.html', content);
