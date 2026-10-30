const fs = require('fs');

let admin = fs.readFileSync('admin.html', 'utf8');

// 1. Add autoFetchAllTVEpisodes and update TV seasons logic
const tvSeasonsAnchor = `// ==========================================
        // TV SEASONS & EPISODES MANAGER
        // ==========================================`;

const tvSeasonsCode = `// ==========================================
        // TV SEASONS & EPISODES MANAGER
        // ==========================================
        window.tempTVSeasons = {};

        window.autoFetchAllTVEpisodes = async function(customTmdbId = null) {
            let tmdbId = customTmdbId || document.getElementById('t-form-tmdb')?.value.trim();
            if (!tmdbId) {
                const query = document.getElementById('t-fetch-query')?.value.trim() || document.getElementById('t-form-title')?.value.trim();
                if (query && /^\\d+$/.test(query)) {
                    tmdbId = query;
                }
            }
            if (!tmdbId || !/^\\d+$/.test(String(tmdbId))) {
                alert("Please enter or fetch a valid numeric TMDB ID first.");
                return;
            }

            const key = (window.siteSettings && window.siteSettings.tmdbKey) ? window.siteSettings.tmdbKey.trim() : (window.TMDB_API_KEY || "eaa427dc2d3150ffec741537c8e0de6d");
            if (!key) {
                alert("No TMDB API Key available.");
                return;
            }

            const btn = document.getElementById('btn-auto-fetch-tv-episodes');
            const origHtml = btn ? btn.innerHTML : '';
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i> Fetching Seasons & Episodes...';
            }

            try {
                const tvRes = await fetch(\`https://api.themoviedb.org/3/tv/\${tmdbId}?api_key=\${key}&append_to_response=watch/providers\`);
                if (!tvRes.ok) throw new Error("Could not find TV Show with TMDB ID " + tmdbId);
                const tvData = await tvRes.json();

                if (!window.tempTVSeasons) window.tempTVSeasons = {};
                
                const seasonsList = tvData.seasons && Array.isArray(tvData.seasons) ? tvData.seasons : [];
                let validSeasons = seasonsList.filter(s => s.season_number > 0);
                if (validSeasons.length === 0 && seasonsList.length > 0) validSeasons = seasonsList;
                if (validSeasons.length === 0) validSeasons = [{ season_number: 1 }];

                let totalEps = 0;

                for (const s of validSeasons) {
                    const sNum = s.season_number || 1;
                    try {
                        const epRes = await fetch(\`https://api.themoviedb.org/3/tv/\${tmdbId}/season/\${sNum}?api_key=\${key}\`);
                        if (epRes.ok) {
                            const epData = await epRes.json();
                            const episodes = {};
                            if (epData.episodes && Array.isArray(epData.episodes)) {
                                epData.episodes.forEach(ep => {
                                    const epNum = ep.episode_number || 1;
                                    const epKey = String(epNum);
                                    episodes[epKey] = {
                                        episodeNumber: epNum,
                                        title: ep.name || (\`Episode \${epNum}\`),
                                        overview: ep.overview || '',
                                        still: ep.still_path ? ('https://image.tmdb.org/t/p/w500' + ep.still_path) : '',
                                        servers: window.generateTVEpisodeServers(tmdbId, sNum, epNum)
                                    };
                                    totalEps++;
                                });
                            }
                            if (Object.keys(episodes).length > 0) {
                                window.tempTVSeasons[String(sNum)] = {
                                    seasonNumber: String(sNum),
                                    episodes: episodes
                                };
                            }
                        }
                    } catch(err) {
                        console.warn(\`Error fetching season \${sNum}:\`, err);
                    }
                }

                const tvId = window.currentTVId;
                if (tvId && window.contentData['tv'] && window.contentData['tv'][tvId]) {
                    window.contentData['tv'][tvId].seasons = window.tempTVSeasons;
                }

                const seasonsCont = document.getElementById('tv-seasons-container');
                if (seasonsCont) seasonsCont.classList.remove('hidden');
                window.renderTVSeasons(tvId);
                if (typeof window.renderEpisodesList === 'function' && window.currentSeasonNum) {
                    window.renderEpisodesList();
                }

                alert(\`Successfully auto-fetched \${totalEps} episodes across \${Object.keys(window.tempTVSeasons).length} season(s) with Vidout & embed servers!\`);
            } catch(e) {
                console.error("Auto fetch episodes error:", e);
                alert("Auto-fetch failed: " + e.message);
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = origHtml;
                }
            }
        };`;

if (!admin.includes('window.autoFetchAllTVEpisodes =')) {
  admin = admin.replace(tvSeasonsAnchor, tvSeasonsCode);
  console.log('Inserted window.autoFetchAllTVEpisodes.');
}

// 2. Update renderTVSeasons to use window.tempTVSeasons
const oldRenderTVSeasonsRegex = /window\.renderTVSeasons = function\(tvId\) \{[\s\S]*?const data = window\.contentData\['tv'\]\[tvId\];[\s\S]*?container\.innerHTML = '';[\s\S]*?if\(!data\.seasons\) data\.seasons = \{ "1": \{ seasonNumber: "1", episodes: \{\} \} \};[\s\S]*?Object\.keys\(data\.seasons\)\.sort\(\(a,b\) => parseInt\(a\)-parseInt\(b\)\)\.forEach\(sNum => \{[\s\S]*?container\.innerHTML \+= `[\s\S]*?`;\s*\}\);\s*\};?/;

const newRenderTVSeasonsCode = `window.renderTVSeasons = function(tvId) {
            let seasonsData = window.tempTVSeasons;
            if (!seasonsData || Object.keys(seasonsData).length === 0) {
                if (tvId && window.contentData['tv'] && window.contentData['tv'][tvId] && window.contentData['tv'][tvId].seasons) {
                    seasonsData = window.contentData['tv'][tvId].seasons;
                    window.tempTVSeasons = seasonsData;
                }
            }
            if (!seasonsData || Object.keys(seasonsData).length === 0) {
                seasonsData = { "1": { seasonNumber: "1", episodes: {} } };
                window.tempTVSeasons = seasonsData;
            }
            const container = document.getElementById('tv-seasons-list');
            if (!container) return;
            container.innerHTML = '';
            
            Object.keys(seasonsData).sort((a,b) => parseInt(a)-parseInt(b)).forEach(sNum => {
                const season = seasonsData[sNum];
                if (!season) return;
                const epCount = season.episodes ? Object.keys(season.episodes).length : 0;
                container.innerHTML += \`
                    <div class="bg-[#222] border border-gray-800 p-4 rounded-xl mb-3 flex items-center justify-between shadow-sm">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-netflixRed/15 border border-netflixRed/30 flex items-center justify-center text-netflixRed font-bold">
                                S\${season.seasonNumber}
                            </div>
                            <div>
                                <h4 class="font-bold text-white text-base">Season \${season.seasonNumber}</h4>
                                <p class="text-xs text-emerald-400 font-semibold">\${epCount} Episodes Available</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button type="button" onclick="openEpisodes('\${tvId || ''}', '\${season.seasonNumber}')" class="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white px-3.5 py-1.5 rounded-lg font-bold transition text-xs flex items-center gap-1.5">
                                <i class="fas fa-list"></i> Manage Episodes
                            </button>
                            <button type="button" onclick="deleteSeason('\${tvId || ''}', '\${season.seasonNumber}')" class="bg-red-500/10 hover:bg-red-500/30 text-red-500 border border-red-500/30 px-3 py-1.5 rounded-lg transition text-xs" title="Delete Season">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                \`;
            });
        };`;

if (oldRenderTVSeasonsRegex.test(admin)) {
  admin = admin.replace(oldRenderTVSeasonsRegex, newRenderTVSeasonsCode);
  console.log('Updated renderTVSeasons.');
}

// 3. Update openEpisodes and renderEpisodesList to use window.tempTVSeasons
const oldOpenEpisodesRegex = /window\.openEpisodes = function\(tvId, seasonNum\) \{[\s\S]*?renderEpisodesList\(\);\s*\}/;

const newOpenEpisodesCode = `window.openEpisodes = function(tvId, seasonNum) {
            window.currentTVId = tvId || null;
            window.currentSeasonNum = seasonNum;
            const title = document.getElementById('t-form-title')?.value || 'TV Show';
            document.getElementById('ep-modal-title').innerText = \`\${title} - Season \${seasonNum}\`;
            document.getElementById('ep-modal').classList.remove('hidden-panel');
            renderEpisodesList();
        }`;

if (oldOpenEpisodesRegex.test(admin)) {
  admin = admin.replace(oldOpenEpisodesRegex, newOpenEpisodesCode);
  console.log('Updated openEpisodes.');
}

// 4. Update saveMovie to auto-commit pending inputs and sync cast/servers/downloads
const oldSaveMovieBlockRegex = /window\.saveMovie = async function\(e\) \{[\s\S]*?await set\(ref\(db, `movies\/\$\{firebaseKey\}`\), cleanFirebaseData\(data\)\);[\s\S]*?loadContentList\('adult'\);\s*\} catch\(err\) \{[\s\S]*?\}\s*\}/;

const newSaveMovieCode = `window.saveMovie = async function(e) {
            e.preventDefault();
            try {
                let firebaseKey = window.currentMovieId;
                if (!firebaseKey) {
                    let idInput = document.getElementById('m-form-id').value.trim();
                    firebaseKey = idInput ? idInput : 'm_' + Date.now();
                }
                
                if (!window.contentData['movie']) window.contentData['movie'] = {};
                let data = (window.currentMovieId && window.contentData['movie'][window.currentMovieId]) ? window.contentData['movie'][window.currentMovieId] : {};
                
                // AUTO-COMMIT PENDING VIDEO SOURCES (if entered but not clicked Add)
                const pendingSrvName = document.getElementById('m-add-srv-name')?.value.trim();
                const pendingSrvUrl = document.getElementById('m-add-srv-url')?.value.trim();
                if (pendingSrvUrl) {
                    if (!window.tempMovieServers) window.tempMovieServers = {};
                    const key = window.editingMovieServerKey || ('srv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
                    window.tempMovieServers[key] = {
                        name: pendingSrvName || ('Server ' + (Object.keys(window.tempMovieServers).length + 1)),
                        url: pendingSrvUrl,
                        type: "mp4",
                        enabled: true
                    };
                    document.getElementById('m-add-srv-name').value = '';
                    document.getElementById('m-add-srv-url').value = '';
                    window.editingMovieServerKey = null;
                    window.renderMovieServers();
                }

                // AUTO-COMMIT PENDING CAST (if entered but not clicked Add)
                const pendingCastName = document.getElementById('m-add-cast-name')?.value.trim();
                if (pendingCastName) {
                    const pendingCastRole = document.getElementById('m-add-cast-role')?.value.trim() || '';
                    const pendingCastImg = document.getElementById('m-add-cast-image')?.value.trim() || '';
                    if (!window.tempMovieCast) window.tempMovieCast = [];
                    window.tempMovieCast.push({ name: pendingCastName, role: pendingCastRole, image: pendingCastImg });
                    document.getElementById('m-add-cast-name').value = '';
                    document.getElementById('m-add-cast-role').value = '';
                    document.getElementById('m-add-cast-image').value = '';
                    window.renderMovieCast(true);
                }

                // AUTO-COMMIT PENDING DOWNLOADS (if entered but not clicked Add)
                const pendingDlName = document.getElementById('m-add-dl-name')?.value.trim();
                const pendingDlUrl = document.getElementById('m-add-dl-url')?.value.trim();
                if (pendingDlUrl) {
                    if (!window.tempMovieDownloads) window.tempMovieDownloads = {};
                    const key = window.editingMovieDownloadKey || ('dl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
                    window.tempMovieDownloads[key] = {
                        name: pendingDlName || ('Download Mirror ' + (Object.keys(window.tempMovieDownloads).length + 1)),
                        url: pendingDlUrl
                    };
                    document.getElementById('m-add-dl-name').value = '';
                    document.getElementById('m-add-dl-url').value = '';
                    window.editingMovieDownloadKey = null;
                    window.renderMovieDownloads();
                }

                // SYNC CAST FROM STRING INPUT
                const mCastInput = document.getElementById('m-form-cast-str');
                if (mCastInput && mCastInput.value.trim()) {
                    const strNames = mCastInput.value.split(',').map(s=>s.trim()).filter(Boolean);
                    const existing = window.tempMovieCast || [];
                    const merged = strNames.map(name => {
                        const found = existing.find(c => c && c.name && c.name.toLowerCase() === name.toLowerCase());
                        return found ? found : { name, role: '', image: '' };
                    });
                    window.tempMovieCast = merged;
                }

                data.id = document.getElementById('m-form-id').value.trim() || firebaseKey;
                data.title = document.getElementById('m-form-title').value.trim();
                data.poster = document.getElementById('m-form-poster').value.trim();
                data.backdrop = document.getElementById('m-form-backdrop').value.trim();
                data.year = document.getElementById('m-form-year').value.trim();
                data.ageRating = document.getElementById('m-form-ageRating').value.trim();
                data.rating = document.getElementById('m-form-rating').value.trim() ? parseFloat(document.getElementById('m-form-rating').value) : '';
                data.overview = document.getElementById('m-form-overview').value.trim();
                data.status = document.getElementById('m-form-status').value;
                const cols = document.getElementById('m-form-collections').value;
                data.collections = cols ? cols.split(',').map(s=>s.trim()).filter(s=>s) : [];
                
                const movieNets = window.selectedNetworks['movie'] || [];
                data.networks = movieNets.map(name => ({ name }));
                data.network = movieNets.join(', ');
                                
                data.tmdbId = document.getElementById('m-form-tmdb').value.trim();
                data.imdbId = document.getElementById('m-form-imdb').value.trim();
                data.videoQuality = document.getElementById('m-form-quality').value.trim();
                data.releaseDate = document.getElementById('m-form-release').value;
                
                const aLang = document.getElementById('m-form-audio').value;
                data.audioLang = aLang ? aLang.split(',').map(s=>s.trim()).filter(s=>s) : [];
                
                const sLang = document.getElementById('m-form-subs').value;
                data.subLang = sLang ? sLang.split(',').map(s=>s.trim()).filter(s=>s) : [];
                
                const gens = document.getElementById('m-form-genres').value;
                data.genres = gens ? gens.split(',').map(s=>s.trim()).filter(s=>s) : [];
                
                data.featured = document.getElementById('m-flag-featured').checked;
                data.trending = document.getElementById('m-flag-trending').checked;
                data.new = document.getElementById('m-flag-new').checked;
                const isAdult = !!(window.isAdultMode || document.getElementById('m-flag-adult')?.checked);
                data.adult = isAdult;
                if (isAdult) {
                    if (!data.ageRating) data.ageRating = '18+';
                    if (!data.genres || data.genres.length === 0) {
                        data.genres = ['Adult', '18+'];
                    } else if (!data.genres.some(g => /adult|18\\+|porn|erotic/i.test(g))) {
                        data.genres.push('Adult');
                    }
                } else {
                    data.adult = false;
                    if (data.genres && Array.isArray(data.genres)) {
                        data.genres = data.genres.filter(g => !/^(adult|18\\+|porn|erotic)$/i.test(g.trim()));
                    }
                    if (data.ageRating && /18\\+/i.test(data.ageRating) && !data.adult) {
                        data.ageRating = 'PG-13';
                    }
                }
                data.highlightBadge = document.getElementById('m-form-highlight').value.trim();
                data.badge = data.highlightBadge;
                const t10 = document.getElementById('m-form-top10').value;
                data.top10Rank = t10 ? parseInt(t10) : null;
                
                data.type = 'movie';
                data.cast = window.tempMovieCast || [];
                data.servers = window.tempMovieServers || {};
                data.downloads = window.tempMovieDownloads || {};
                data.createdAt = data.createdAt || Date.now();
                data.updatedAt = Date.now();

                await set(ref(db, \`movies/\${firebaseKey}\`), cleanFirebaseData(data));
                window.contentData['movie'][firebaseKey] = data;
                alert(isAdult ? '18+ Adult content saved successfully!' : 'Movie saved successfully!');
                closeMovieEditor();
                loadContentList('movie');
                loadContentList('adult');
            } catch(err) {
                console.error("Save Movie Error:", err);
                alert("Error saving movie: " + err.message);
            }
        };`;

if (oldSaveMovieBlockRegex.test(admin)) {
  admin = admin.replace(oldSaveMovieBlockRegex, newSaveMovieCode);
  console.log('Updated saveMovie with robust manual data capture.');
}

// 5. Update saveTV to save window.tempTVSeasons and pending inputs
const oldSaveTVBlockRegex = /window\.saveTV = async function\(e\) \{[\s\S]*?await set\(ref\(db, `tvShows\/\$\{firebaseKey\}`\), cleanFirebaseData\(data\)\);[\s\S]*?loadContentList\('adult'\);\s*\} catch\(err\) \{[\s\S]*?\}\s*\}/;

const newSaveTVCode = `window.saveTV = async function(e) {
            e.preventDefault();
            try {
                let firebaseKey = window.currentTVId;
                if (!firebaseKey) {
                    let idInput = document.getElementById('t-form-id').value.trim();
                    firebaseKey = idInput ? idInput : 't_' + Date.now();
                }
                
                if (!window.contentData['tv']) window.contentData['tv'] = {};
                let data = (window.currentTVId && window.contentData['tv'][window.currentTVId]) ? window.contentData['tv'][window.currentTVId] : {};
                
                // AUTO-COMMIT PENDING CAST (if entered but not clicked Add)
                const pendingCastName = document.getElementById('t-add-cast-name')?.value.trim();
                if (pendingCastName) {
                    const pendingCastRole = document.getElementById('t-add-cast-role')?.value.trim() || '';
                    const pendingCastImg = document.getElementById('t-add-cast-image')?.value.trim() || '';
                    if (!window.tempTVCast) window.tempTVCast = [];
                    window.tempTVCast.push({ name: pendingCastName, role: pendingCastRole, image: pendingCastImg });
                    document.getElementById('t-add-cast-name').value = '';
                    document.getElementById('t-add-cast-role').value = '';
                    document.getElementById('t-add-cast-image').value = '';
                    window.renderTVCast(true);
                }

                // SYNC CAST FROM STRING INPUT
                const tCastInput = document.getElementById('t-form-cast-str');
                if (tCastInput && tCastInput.value.trim()) {
                    const strNames = tCastInput.value.split(',').map(s=>s.trim()).filter(Boolean);
                    const existing = window.tempTVCast || [];
                    const merged = strNames.map(name => {
                        const found = existing.find(c => c && c.name && c.name.toLowerCase() === name.toLowerCase());
                        return found ? found : { name, role: '', image: '' };
                    });
                    window.tempTVCast = merged;
                }

                data.id = document.getElementById('t-form-id').value.trim() || firebaseKey;
                data.title = document.getElementById('t-form-title').value.trim();
                data.poster = document.getElementById('t-form-poster').value.trim();
                data.backdrop = document.getElementById('t-form-backdrop').value.trim();
                data.year = document.getElementById('t-form-year').value.trim();
                data.ageRating = document.getElementById('t-form-ageRating').value.trim();
                data.rating = document.getElementById('t-form-rating').value.trim() ? parseFloat(document.getElementById('t-form-rating').value) : '';
                data.overview = document.getElementById('t-form-overview').value.trim();
                data.status = document.getElementById('t-form-status').value;
                const cols = document.getElementById('t-form-collections').value;
                data.collections = cols ? cols.split(',').map(s=>s.trim()).filter(s=>s) : [];
                
                const tvNets = window.selectedNetworks['tv'] || [];
                data.networks = tvNets.map(name => ({ name }));
                data.network = tvNets.join(', ');
                                
                data.tmdbId = document.getElementById('t-form-tmdb').value.trim();
                data.imdbId = document.getElementById('t-form-imdb').value.trim();
                data.videoQuality = document.getElementById('t-form-quality').value.trim();
                data.releaseDate = document.getElementById('t-form-release').value;
                
                const aLang = document.getElementById('t-form-audio').value;
                data.audioLang = aLang ? aLang.split(',').map(s=>s.trim()).filter(s=>s) : [];
                
                const sLang = document.getElementById('t-form-subs').value;
                data.subLang = sLang ? sLang.split(',').map(s=>s.trim()).filter(s=>s) : [];
                
                const gens = document.getElementById('t-form-genres').value;
                data.genres = gens ? gens.split(',').map(s=>s.trim()).filter(s=>s) : [];
                
                data.featured = document.getElementById('t-flag-featured').checked;
                data.trending = document.getElementById('t-flag-trending').checked;
                data.new = document.getElementById('t-flag-new').checked;
                data.adult = document.getElementById('t-flag-adult').checked;
                data.highlightBadge = document.getElementById('t-form-highlight').value.trim();
                data.badge = data.highlightBadge;
                const t10 = document.getElementById('t-form-top10').value;
                data.top10Rank = t10 ? parseInt(t10) : null;
                
                data.type = 'tv';
                data.cast = window.tempTVCast || [];
                
                // SAVE SEASONS & EPISODES
                if (window.tempTVSeasons && Object.keys(window.tempTVSeasons).length > 0) {
                    data.seasons = window.tempTVSeasons;
                } else if (!data.seasons) {
                    data.seasons = { "1": { seasonNumber: "1", episodes: {} } };
                }
                
                data.createdAt = data.createdAt || Date.now();
                data.updatedAt = Date.now();

                await set(ref(db, \`tvShows/\${firebaseKey}\`), cleanFirebaseData(data));
                window.contentData['tv'][firebaseKey] = data;
                alert('TV Show and all seasons/episodes saved successfully!');
                closeTVEditor();
                loadContentList('tv');
                loadContentList('adult');
            } catch(err) {
                console.error("Save TV Error:", err);
                alert("Error saving TV Show: " + err.message);
            }
        };`;

if (oldSaveTVBlockRegex.test(admin)) {
  admin = admin.replace(oldSaveTVBlockRegex, newSaveTVCode);
  console.log('Updated saveTV with robust season & episode saving.');
}

// 6. In importFromTMDB, auto-fetch TV episodes
const oldImportTMEnd = `if(!silent) alert('Successfully auto-filled metadata from TMDB!');
                if (typeof window.updateMediaPreview === 'function') window.updateMediaPreview(prefix);`;

const newImportTMEnd = `if(!silent) alert('Successfully auto-filled metadata from TMDB!');
                if (typeof window.updateMediaPreview === 'function') window.updateMediaPreview(prefix);
                if (type === 'tv' && data.id) {
                    await window.autoFetchAllTVEpisodes(data.id);
                }`;

if (admin.includes(oldImportTMEnd) && !admin.includes("if (type === 'tv' && data.id) { await window.autoFetchAllTVEpisodes(data.id); }")) {
  admin = admin.replace(oldImportTMEnd, newImportTMEnd);
  console.log('Added autoFetchAllTVEpisodes call to importFromTMDB.');
}

// 7. Add Auto-Fetch Episodes button in TV Modal HTML
const tvSeasonsHeaderAnchor = `<h4 class="font-bold text-gray-300">Seasons & Episodes</h4>`;
const newTvSeasonsHeader = `<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 border-b border-gray-700 pb-2">
                            <h4 class="font-bold text-gray-300 flex items-center gap-2">
                                <i class="fas fa-layer-group text-purple-400"></i> Seasons & Episodes
                            </h4>
                            <button type="button" id="btn-auto-fetch-tv-episodes" onclick="autoFetchAllTVEpisodes()" class="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 shadow cursor-pointer" title="Automatically fetch all seasons, episodes, and Vidout embed servers from TMDB">
                                <i class="fas fa-magic"></i> Auto-Fetch All Seasons & Episodes from TMDB
                            </button>
                        </div>`;

if (admin.includes(tvSeasonsHeaderAnchor)) {
  admin = admin.replace(tvSeasonsHeaderAnchor, newTvSeasonsHeader);
  console.log('Added Auto-Fetch button to TV Modal.');
} else {
  // Try finding <h4 class="font-bold text-gray-300 mb-2 border-b border-gray-700 pb-2">Seasons & Episodes</h4>
  const oldH4 = admin.match(/<h4[^>]*>Seasons & Episodes<\/h4>/);
  if (oldH4) {
    admin = admin.replace(oldH4[0], newTvSeasonsHeader);
    console.log('Replaced Seasons & Episodes header via match.');
  }
}

// 8. Ensure toggleLiveTvFromAdmin writes immediately to child nodes
const oldToggleLiveTvCode = `window.toggleLiveTvFromAdmin = async function(isEnabled) {
            try {
                const settingsRef = ref(db, 'settings');
                const snap = await get(settingsRef);
                const current = snap.exists() ? snap.val() : {};
                current.enableLiveTV = isEnabled;
                current.liveTvEnabled = isEnabled;
                await set(settingsRef, cleanFirebaseData(current));`;

const newToggleLiveTvCode = `window.toggleLiveTvFromAdmin = async function(isEnabled) {
            try {
                const settingsRef = ref(db, 'settings');
                const snap = await get(settingsRef);
                const current = snap.exists() ? snap.val() : {};
                current.enableLiveTV = isEnabled;
                current.liveTvEnabled = isEnabled;
                await set(settingsRef, cleanFirebaseData(current));
                await set(ref(db, 'settings/enableLiveTV'), isEnabled);
                await set(ref(db, 'settings/liveTvEnabled'), isEnabled);`;

if (admin.includes(oldToggleLiveTvCode)) {
  admin = admin.replace(oldToggleLiveTvCode, newToggleLiveTvCode);
  console.log('Updated toggleLiveTvFromAdmin child writes.');
}

fs.writeFileSync('admin.html', admin, 'utf8');
console.log('All admin.html patches completed successfully.');
