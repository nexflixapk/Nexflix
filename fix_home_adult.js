const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Remove it from under Trending
const targetRemove = `            // --- 18+ Adult Content Row ---
            const allAdult = [
                ...Object.values(rawMovies).filter(m => m && m.status !== 'draft' && m.adult).map(m=>({...m, type:'movie'})),
                ...Object.values(rawTvShows).filter(t => t && t.status !== 'draft' && t.adult).map(t=>({...t, type:'tv'}))
            ].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 15);
            if (allAdult.length > 0) {
                html += generateRow("<span class='text-pink-500'><i class='fas fa-heart mr-2 drop-shadow-md'></i> 18+ Adult Content</span>", allAdult, 'section-adult', '#adult');
            }`;
code = code.replace(targetRemove, "");

// Add it under TV Shows
const targetTVShows = `            if(allTvShows.length > 0) html += generateRow('TV Shows', allTvShows, 'section-tv-shows', '#tv');`;
const replaceTVShows = `            if(allTvShows.length > 0) html += generateRow('TV Shows', allTvShows, 'section-tv-shows', '#tv');
            
            // --- 18+ Adult Row ---
            const allAdult = [
                ...Object.values(rawMovies).filter(m => m && m.status !== 'draft' && m.adult).map(m=>({...m, type:'movie'})),
                ...Object.values(rawTvShows).filter(t => t && t.status !== 'draft' && t.adult).map(t=>({...t, type:'tv'}))
            ].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 15);
            if (allAdult.length > 0) {
                html += generateRow("<span class='text-pink-500'><i class='fas fa-heart mr-2 drop-shadow-md'></i> 18+ Adult</span>", allAdult, 'section-adult', '#adult');
            }`;

code = code.replace(targetTVShows, replaceTVShows);
fs.writeFileSync('index.html', code);
