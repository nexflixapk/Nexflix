// We need to see if the fallback save is actually saving data to localStorage
const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const hook = `
                                // --- FALLBACK CONTINUE WATCHING SAVE ---
                // For embeds (and initially for native), save at least a 0% progress so it shows up in history immediately
                try {
                    const currentId = typeof id !== 'undefined' ? id : (itemDetails ? itemDetails.id : '');
                    const currentType = typeof type !== 'undefined' ? type : (itemDetails && itemDetails.seasons ? 'tv' : 'movie');
                    const currentSeason = typeof season !== 'undefined' && season !== 'undefined' ? season : '';
                    const currentEpisode = typeof episode !== 'undefined' && episode !== 'undefined' ? episode : '';
                    
                    if (currentId && itemDetails) {
                        let cw = JSON.parse(localStorage.getItem('nexora_continue_watching') || '[]');
                        cw = cw.filter(c => !(String(c.id) === String(currentId) && c.type === currentType && String(c.season) === String(currentSeason) && String(c.episode) === String(currentEpisode)));
                        
                        // ONLY save if it has a valid season/episode for TV shows
                        if (currentType === 'movie' || (currentType === 'tv' && currentSeason && currentEpisode)) {
                            cw.unshift({
                                id: currentId, 
                                type: currentType, 
                                season: currentSeason, 
                                episode: currentEpisode,
                                episodeNum: typeof epNum !== 'undefined' ? epNum : (currentEpisode || ''),
                                progress: 0,
                                duration: 1, // Avoid NaN
                                title: currentType === 'movie' ? itemDetails.title : \\\`\\\${itemDetails.title} (S\\\${currentSeason} E\\\${typeof epNum !== 'undefined' && epNum ? epNum : currentEpisode})\\\`,
                                poster: itemDetails.poster,
                                ts: Date.now()
                            });
                            if(cw.length > 20) cw = cw.slice(0, 20);
                            localStorage.setItem('nexora_continue_watching', JSON.stringify(cw));
                            console.log('Saved fallback CW', cw);
                        }
                    }
                } catch(e) { console.error('Error saving initial history', e); }
`;

content = content.replace(
    /\/\/ --- FALLBACK CONTINUE WATCHING SAVE ---[\s\S]*?\} catch\(e\) \{ console\.error\('Error saving initial history', e\); \}/m,
    hook.trim()
);

fs.writeFileSync('index.html', content);
