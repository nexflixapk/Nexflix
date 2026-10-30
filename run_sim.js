const fs = require('fs');

// Mock localStorage
global.localStorage = {
    _data: {},
    getItem: function(key) { return this._data[key] || null; },
    setItem: function(key, value) { this._data[key] = String(value); },
    removeItem: function(key) { delete this._data[key]; },
    clear: function() { this._data = {}; }
};

// Simulate what happens when saving fallback CW
function simulateSave(id, type, season, episode, itemDetails, epNum) {
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
                    title: currentType === 'movie' ? itemDetails.title : `${itemDetails.title} (S${currentSeason} E${typeof epNum !== 'undefined' && epNum ? epNum : currentEpisode})`,
                    poster: itemDetails.poster,
                    ts: Date.now()
                });
                if(cw.length > 20) cw = cw.slice(0, 20);
                localStorage.setItem('nexora_continue_watching', JSON.stringify(cw));
                console.log('Saved fallback CW:', JSON.stringify(cw, null, 2));
            } else {
                console.log('Did not save CW: Invalid type/season/episode', {currentType, currentSeason, currentEpisode});
            }
        } else {
            console.log('Did not save CW: Missing id or itemDetails');
        }
    } catch(e) { console.error('Error saving initial history', e); }
}

console.log("--- TEST 1: MOVIE ---");
simulateSave('m1', 'movie', undefined, undefined, {id: 'm1', title: 'Test Movie', poster: 'test.jpg'});

console.log("\n--- TEST 2: TV SHOW ---");
simulateSave('t1', 'tv', '1', 'ep1', {id: 't1', title: 'Test TV', poster: 'test2.jpg'}, '1');

console.log("\n--- TEST 3: TV SHOW MISSING SEASON ---");
simulateSave('t2', 'tv', undefined, 'ep1', {id: 't2', title: 'Test TV 2', poster: 'test3.jpg'}, '1');

// Now simulate the render process
function simulateRender() {
    let cw = []; try { cw = JSON.parse(localStorage.getItem('nexora_continue_watching') || '[]'); } catch(e) {}
    console.log("\n--- RENDER PHASE ---");
    console.log("Loaded CW from storage:", cw);
    
    if (cw && cw.length > 0) {
        const cwItems = cw.map(c => {
            return {...c, isCw: true};
        });
        
        console.log('Rendering CW row with items:', cwItems);
    } else {
        console.log("No CW items to render.");
    }
}

simulateRender();

