        window.defaultAutoUpdateSettings = {
            enabled: true,
            intervalHours: 6,
            limitPerFeed: 10,
            status: 'published',
            addNewTitles: true,
            autoAllEpisodes: true,
            autoMissingEpisodes: true,
            autoServers: true,
            autoEpisodes: true,
            autoTrending: true,
            updateExisting: true,
            feeds: {
                trendingMovies: true,
                popularMovies: true,
                nowPlaying: true,
                trendingTV: true,
                popularTV: true,
                topRated: false
            },
            lastRun: null,
            lastResult: null
        };

        window.currentAutoUpdateSettings = { ...window.defaultAutoUpdateSettings };

        window.loadAutoUpdateView = async function() {
            try {
                if (window.dbRef) {
                    const snap = await get(child(window.dbRef, 'autoUpdateSettings'));
                    if (snap.exists()) {
                        const data = snap.val();
                        window.currentAutoUpdateSettings = Object.assign({}, window.defaultAutoUpdateSettings, data);
                    }
                }
                
                const s = window.currentAutoUpdateSettings;
                const toggleEl = document.getElementById('autoupdate-master-toggle');
                if (toggleEl) toggleEl.checked = (s.enabled !== false);
                
                const intervalEl = document.getElementById('autoupdate-interval-select');
                if (intervalEl) intervalEl.value = String(s.intervalHours || 6);
                
                const limitEl = document.getElementById('autoupdate-limit-select');
                if (limitEl) limitEl.value = String(s.limitPerFeed || 10);
                
                const statusEl = document.getElementById('autoupdate-status-select');
                if (statusEl) statusEl.value = s.status || 'published';

                const addNewEl = document.getElementById('autoupdate-add-new-toggle');
                if (addNewEl) addNewEl.checked = (s.addNewTitles !== false);

                const allEpEl = document.getElementById('autoupdate-all-episodes-toggle');
                if (allEpEl) allEpEl.checked = (s.autoAllEpisodes !== false);

                const missEpEl = document.getElementById('autoupdate-missing-episodes-toggle');
                if (missEpEl) missEpEl.checked = (s.autoMissingEpisodes !== false);
                
                const srvEl = document.getElementById('autoupdate-servers-toggle');
                if (srvEl) srvEl.checked = (s.autoServers !== false);
                
                const epEl = document.getElementById('autoupdate-episodes-toggle');
                if (epEl) epEl.checked = (s.autoEpisodes !== false);
                
                const trendEl = document.getElementById('autoupdate-trending-toggle');
                if (trendEl) trendEl.checked = (s.autoTrending !== false);
                
                const existEl = document.getElementById('autoupdate-existing-toggle');
                if (existEl) existEl.checked = !!s.updateExisting;
                
                const feeds = s.feeds || {};
                if (document.getElementById('feed-trending-movies')) document.getElementById('feed-trending-movies').checked = (feeds.trendingMovies !== false);
                if (document.getElementById('feed-popular-movies')) document.getElementById('feed-popular-movies').checked = (feeds.popularMovies !== false);
                if (document.getElementById('feed-now-playing')) document.getElementById('feed-now-playing').checked = (feeds.nowPlaying !== false);
                if (document.getElementById('feed-trending-tv')) document.getElementById('feed-trending-tv').checked = (feeds.trendingTV !== false);
                if (document.getElementById('feed-popular-tv')) document.getElementById('feed-popular-tv').checked = (feeds.popularTV !== false);
                if (document.getElementById('feed-top-rated')) document.getElementById('feed-top-rated').checked = !!feeds.topRated;
                
                updateAutoUpdateUIStats();
                loadAutoUpdateHistory();
            } catch(e) {
                console.error("Error loading auto-update settings:", e);
            }
        };

        function updateAutoUpdateUIStats() {
            const s = window.currentAutoUpdateSettings;
            const isAct = (s.enabled !== false);
            
            const statusPill = document.getElementById('autoupdate-status-pill');
            if (statusPill) {
                if (isAct) {
                    statusPill.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> AUTOMATION ACTIVE';
                    statusPill.className = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2';
                } else {
                    statusPill.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400"></span> AUTOMATION PAUSED';
                    statusPill.className = 'bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2';
                }
            }
            
            const cardStatus = document.getElementById('card-autoupdate-status-text');
            if (cardStatus) {
                cardStatus.innerText = isAct ? ('Active (' + (s.intervalHours || 6) + 'h)') : 'Paused';
                cardStatus.className = isAct ? 'text-2xl font-black text-emerald-400' : 'text-2xl font-black text-amber-400';
            }
            
            const lastRunEl = document.getElementById('card-autoupdate-last-run');
            if (lastRunEl) {
                if (s.lastRun) {
                    const d = new Date(s.lastRun);
                    lastRunEl.innerText = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } else {
                    lastRunEl.innerText = 'Ready to run';
                }
            }
            
            const nextRunEl = document.getElementById('card-autoupdate-next-run');
            if (nextRunEl) {
                if (isAct && s.lastRun) {
                    const nextTime = new Date(s.lastRun + (s.intervalHours || 6) * 3600 * 1000);
                    if (nextTime < new Date()) {
                        nextRunEl.innerText = 'Due on next check';
                    } else {
                        nextRunEl.innerText = nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    }
                } else if (isAct) {
                    nextRunEl.innerText = 'Ready on trigger';
                } else {
                    nextRunEl.innerText = 'Disabled';
                }
            }
            
            const lastResEl = document.getElementById('card-autoupdate-last-added');
            if (lastResEl) {
                if (s.lastResult && s.lastResult.added !== undefined) {
                    lastResEl.innerText = '+' + s.lastResult.added + ' items';
                } else {
                    lastResEl.innerText = '+0 items';
                }
            }
            
            const dashTag = document.getElementById('dash-autoupdate-status-tag');
            if (dashTag) {
                dashTag.innerHTML = isAct ? ('<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ACTIVE (' + (s.intervalHours || 6) + 'h)') : '<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> PAUSED';
                dashTag.className = isAct ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5';
            }
            const dashLast = document.getElementById('dash-autoupdate-last-time');
            if (dashLast && s.lastRun) {
                const d = new Date(s.lastRun);
                dashLast.innerText = 'Last sync: ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + (s.lastResult ? (' (+' + (s.lastResult.added || 0) + ')') : '');
            }
        }
        window.updateAutoUpdateUIStats = updateAutoUpdateUIStats;

        window.saveAutoUpdateSettings = async function(e) {
            if (e) e.preventDefault();
            try {
                const settings = {
                    enabled: document.getElementById('autoupdate-master-toggle')?.checked !== false,
                    intervalHours: Number(document.getElementById('autoupdate-interval-select')?.value || 6),
                    limitPerFeed: Number(document.getElementById('autoupdate-limit-select')?.value || 10),
                    status: document.getElementById('autoupdate-status-select')?.value || 'published',
                    addNewTitles: document.getElementById('autoupdate-add-new-toggle')?.checked !== false,
                    autoAllEpisodes: document.getElementById('autoupdate-all-episodes-toggle')?.checked !== false,
                    autoMissingEpisodes: document.getElementById('autoupdate-missing-episodes-toggle')?.checked !== false,
                    autoServers: document.getElementById('autoupdate-servers-toggle')?.checked !== false,
                    autoEpisodes: document.getElementById('autoupdate-episodes-toggle')?.checked !== false,
                    autoTrending: document.getElementById('autoupdate-trending-toggle')?.checked !== false,
                    updateExisting: document.getElementById('autoupdate-existing-toggle')?.checked || false,
                    feeds: {
                        trendingMovies: document.getElementById('feed-trending-movies')?.checked !== false,
                        popularMovies: document.getElementById('feed-popular-movies')?.checked !== false,
                        nowPlaying: document.getElementById('feed-now-playing')?.checked !== false,
                        trendingTV: document.getElementById('feed-trending-tv')?.checked !== false,
                        popularTV: document.getElementById('feed-popular-tv')?.checked !== false,
                        topRated: document.getElementById('feed-top-rated')?.checked || false
                    },
                    lastRun: window.currentAutoUpdateSettings.lastRun || null,
                    lastResult: window.currentAutoUpdateSettings.lastResult || null,
                    updatedAt: Date.now()
                };
                
                window.currentAutoUpdateSettings = settings;
                await set(ref(db, 'autoUpdateSettings'), cleanFirebaseData(settings));
                updateAutoUpdateUIStats();
                alert('Auto Update configuration saved successfully!');
            } catch(err) {
                console.error("Save auto-update error:", err);
                alert('Failed to save settings: ' + err.message);
            }
        };

        window.appendAutoUpdateLog = function(msg, type = 'info') {
            const consoleEl = document.getElementById('autoupdate-console');
            if (!consoleEl) return;
            const now = new Date().toLocaleTimeString();
            let colorClass = 'text-gray-300';
            let icon = '•';
            if (type === 'success') { colorClass = 'text-emerald-400 font-bold'; icon = '✅'; }
            else if (type === 'warn') { colorClass = 'text-amber-400'; icon = '⚠️'; }
            else if (type === 'error') { colorClass = 'text-red-400 font-bold'; icon = '❌'; }
            else if (type === 'skip') { colorClass = 'text-gray-500'; icon = '⏭️'; }
            else if (type === 'update') { colorClass = 'text-blue-400 font-medium'; icon = '🔄'; }
            else if (type === 'init') { colorClass = 'text-cyan-400 font-bold'; icon = '⚡'; }
            
            const line = document.createElement('div');
            line.className = 'font-mono text-xs leading-relaxed py-0.5 flex items-start gap-2 ' + colorClass;
            line.innerHTML = '<span class="text-gray-600 select-none">[' + now + ']</span> <span>' + icon + '</span> <span class="flex-1 break-words">' + msg + '</span>';
            consoleEl.appendChild(line);
            consoleEl.scrollTop = consoleEl.scrollHeight;
        };

        window.runAutoUpdate = async function(force = true, isBackground = false, runOptions = {}) {
            if (window.isAutoUpdating) {
                if (!isBackground) alert('Auto-update is currently running. Please wait for the current batch to complete.');
                return;
            }
            window.isAutoUpdating = true;
            
            const runBtn = document.getElementById('btn-run-autoupdate');
            const dashBtn = document.getElementById('dash-btn-run-autoupdate');
            const progressSec = document.getElementById('autoupdate-progress-section');
            const progressBar = document.getElementById('autoupdate-progress-bar');
            const progressPct = document.getElementById('autoupdate-progress-pct');
            const stepLabel = document.getElementById('autoupdate-step-label');
            const badgeAdded = document.getElementById('badge-added-count');
            const badgeUpdated = document.getElementById('badge-updated-count');
            const badgeSkipped = document.getElementById('badge-skipped-count');
            const badgeErrors = document.getElementById('badge-errors-count');
            
            if (runBtn) {
                runBtn.disabled = true;
                runBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i> Running Auto Update...';
            }
            if (dashBtn) {
                dashBtn.disabled = true;
                dashBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1.5"></i> Updating...';
            }
            if (progressSec) progressSec.classList.remove('hidden');
            
            let addedCount = 0;
            let updatedCount = 0;
            let skippedCount = 0;
            let errorCount = 0;
            
            const updateStatsDisplay = () => {
                if (badgeAdded) badgeAdded.innerText = addedCount;
                if (badgeUpdated) badgeUpdated.innerText = updatedCount;
                if (badgeSkipped) badgeSkipped.innerText = skippedCount;
                if (badgeErrors) badgeErrors.innerText = errorCount;
            };
            
            const setProgress = (pct, text) => {
                if (progressBar) progressBar.style.width = pct + '%';
                if (progressPct) progressPct.innerText = Math.round(pct) + '%';
                if (stepLabel) stepLabel.innerText = text;
            };
            
            updateStatsDisplay();
            setProgress(3, 'Connecting to Firebase & TMDB API...');
            window.appendAutoUpdateLog('🚀 Starting Auto Update Content Engine...', 'init');
            
            try {
                const s = window.currentAutoUpdateSettings || {};
                const apiKey = (window.siteSettings && window.siteSettings.tmdbKey) ? window.siteSettings.tmdbKey.trim() : (window.TMDB_API_KEY || "eaa427dc2d3150ffec741537c8e0de6d");
                
                const shouldAddNew = !runOptions.catalogOnly && (runOptions.forceAddNew || s.addNewTitles !== false);
                const shouldSyncEpisodes = !runOptions.catalogOnly && (runOptions.forceSyncEpisodes || s.autoMissingEpisodes !== false);
                const shouldUpdateExisting = runOptions.catalogOnly || !!s.updateExisting;
                
                // 1. Fetch current movies and TV shows from Firebase
                let movies = {};
                let tvShows = {};
                try {
                    if (window.dbRef) {
                        const [mSnap, tSnap] = await Promise.all([
                            get(child(window.dbRef, 'movies')),
                            get(child(window.dbRef, 'tvShows'))
                        ]);
                        if (mSnap.exists()) movies = mSnap.val() || {};
                        if (tSnap.exists()) tvShows = tSnap.val() || {};
                    }
                } catch(sdkErr) {
                    console.warn("SDK fetch failed, trying REST...", sdkErr);
                }
                
                if (Object.keys(movies).length === 0 && Object.keys(tvShows).length === 0) {
                    const dbUrl = window.FIREBASE_CONFIG?.databaseURL || window.FB_URL || "https://nexflix2-3ef14-default-rtdb.asia-southeast1.firebasedatabase.app";
                    try {
                        const [mRes, tRes] = await Promise.all([
                            fetch(dbUrl + '/movies.json'),
                            fetch(dbUrl + '/tvShows.json')
                        ]);
                        if (mRes.ok) movies = (await mRes.json()) || {};
                        if (tRes.ok) tvShows = (await tRes.json()) || {};
                    } catch(restErr) {
                        console.warn("REST fetch error:", restErr);
                    }
                }
                
                // Track existing IDs & titles to prevent duplicates
                const existingMovieTmdb = new Set();
                const existingTVTmdb = new Set();
                const existingMovieTitles = new Set();
                const existingTVTitles = new Set();
                
                Object.entries(movies || {}).forEach(([k, m]) => {
                    if (!m) return;
                    if (m.tmdbId) existingMovieTmdb.add(String(m.tmdbId).trim());
                    if (m.id && /^\d+$/.test(String(m.id))) existingMovieTmdb.add(String(m.id).trim());
                    if (/^(?:movie|m)_(\d+)$/.test(String(k))) existingMovieTmdb.add(k.match(/^(?:movie|m)_(\d+)$/)[1]);
                    if (/^\d+$/.test(String(k))) existingMovieTmdb.add(String(k));
                    if (m.title) existingMovieTitles.add(String(m.title).trim().toLowerCase());
                });
                
                Object.entries(tvShows || {}).forEach(([k, t]) => {
                    if (!t) return;
                    if (t.tmdbId) existingTVTmdb.add(String(t.tmdbId).trim());
                    if (t.id && /^\d+$/.test(String(t.id))) existingTVTmdb.add(String(t.id).trim());
                    if (/^(?:tv|t)_(\d+)$/.test(String(k))) existingTVTmdb.add(k.match(/^(?:tv|t)_(\d+)$/)[1]);
                    if (/^\d+$/.test(String(k))) existingTVTmdb.add(String(k));
                    const tName = t.title || t.name;
                    if (tName) existingTVTitles.add(String(tName).trim().toLowerCase());
                });

                // ==========================================
                // PHASE 1: AUTO-ADD NEW MOVIES & TV SHOWS
                // ==========================================
                if (shouldAddNew) {
                    setProgress(10, 'Fetching newly trending & popular titles from TMDB...');
                    window.appendAutoUpdateLog('📥 Fetching active content feeds from TMDB...', 'init');
                    
                    const feedsCfg = s.feeds || {};
                    const limitPerFeed = Math.min(20, Math.max(1, Number(s.limitPerFeed || 10)));
                    
                    const feedsToFetch = [];
                    if (feedsCfg.trendingMovies !== false) feedsToFetch.push({ type: 'movie', name: 'Trending Movies', url:  });
                    if (feedsCfg.popularMovies !== false) feedsToFetch.push({ type: 'movie', name: 'Popular Movies', url:  });
                    if (feedsCfg.nowPlaying !== false) feedsToFetch.push({ type: 'movie', name: 'Now Playing', url:  });
                    if (feedsCfg.trendingTV !== false) feedsToFetch.push({ type: 'tv', name: 'Trending TV Shows', url:  });
                    if (feedsCfg.popularTV !== false) feedsToFetch.push({ type: 'tv', name: 'Popular TV Shows', url:  });
                    if (feedsCfg.topRated) {
                        feedsToFetch.push({ type: 'movie', name: 'Top Rated Movies', url:  });
                        feedsToFetch.push({ type: 'tv', name: 'Top Rated TV Shows', url:  });
                    }
                    
                    for (const feed of feedsToFetch) {
                        try {
                            const res = await fetch(feed.url);
                            if (!res.ok) continue;
                            const feedData = await res.json();
                            const results = (feedData.results || []).slice(0, limitPerFeed);
                            
                            for (const candidate of results) {
                                const candId = String(candidate.id);
                                const isMovie = (feed.type === 'movie');
                                const candTitle = isMovie ? (candidate.title || candidate.original_title) : (candidate.name || candidate.original_name);
                                const cleanTitle = (candTitle || '').trim();
                                
                                if (isMovie) {
                                    if (existingMovieTmdb.has(candId) || existingMovieTitles.has(cleanTitle.toLowerCase())) {
                                        skippedCount++;
                                        updateStatsDisplay();
                                        continue;
                                    }
                                } else {
                                    if (existingTVTmdb.has(candId) || existingTVTitles.has(cleanTitle.toLowerCase())) {
                                        skippedCount++;
                                        updateStatsDisplay();
                                        continue;
                                    }
                                }
                                
                                setProgress(15 + Math.min(30, (addedCount * 2)), );
                                
                                // Fetch full details from TMDB with credits, videos & providers
                                try {
                                    const dRes = await fetch();
                                    if (!dRes.ok) continue;
                                    const details = await dRes.json();
                                    
                                    const detectedNets = window.detectNetworksFromTMDB(details, feed.type);
                                    let trailerUrl = '';
                                    if (details.videos && details.videos.results) {
                                        const yt = details.videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
                                        if (yt) trailerUrl = ;
                                    }
                                    
                                    const docId = ;
                                    const releaseDate = details.release_date || details.first_air_date || '';
                                    const yearStr = releaseDate.split('-')[0] || '';
                                    
                                    if (isMovie) {
                                        const movieData = {
                                            id: docId,
                                            type: 'movie',
                                            title: details.title || cleanTitle,
                                            overview: details.overview || '',
                                            poster: details.poster_path ?  : '',
                                            backdrop: details.backdrop_path ?  : '',
                                            year: yearStr,
                                            rating: details.vote_average ? Number(details.vote_average).toFixed(1) : 0,
                                            status: s.status || 'published',
                                            tmdbId: candId,
                                            imdbId: details.imdb_id || '',
                                            genres: details.genres ? details.genres.map(g => g.name) : [],
                                            cast: details.credits?.cast?.slice(0, 10).map(c => ({
                                                name: c.name,
                                                role: c.character,
                                                image: c.profile_path ?  : ''
                                            })) || [],
                                            trailer: trailerUrl,
                                            runtime: details.runtime ?  : '',
                                            servers: window.generateMovieServers(candId, details.imdb_id || ''),
                                            trending: (s.autoTrending !== false),
                                            networks: detectedNets.map(name => ({ name })),
                                            network: detectedNets.join(', '),
                                            createdAt: Date.now(),
                                            updatedAt: Date.now()
                                        };
                                        
                                        await set(ref(db, ), cleanFirebaseData(movieData));
                                        existingMovieTmdb.add(candId);
                                        existingMovieTitles.add(cleanTitle.toLowerCase());
                                        addedCount++;
                                        updateStatsDisplay();
                                        window.appendAutoUpdateLog(, 'success');
                                    } else {
                                        // TV Series with Auto Seasons & Episodes
                                        const tvData = {
                                            id: docId,
                                            type: 'tv',
                                            title: details.name || cleanTitle,
                                            overview: details.overview || '',
                                            poster: details.poster_path ?  : '',
                                            backdrop: details.backdrop_path ?  : '',
                                            year: yearStr,
                                            rating: details.vote_average ? Number(details.vote_average).toFixed(1) : 0,
                                            status: s.status || 'published',
                                            tmdbId: candId,
                                            genres: details.genres ? details.genres.map(g => g.name) : [],
                                            cast: details.credits?.cast?.slice(0, 10).map(c => ({
                                                name: c.name,
                                                role: c.character,
                                                image: c.profile_path ?  : ''
                                            })) || [],
                                            trailer: trailerUrl,
                                            trending: (s.autoTrending !== false),
                                            networks: detectedNets.map(name => ({ name })),
                                            network: detectedNets.join(', '),
                                            seasons: {},
                                            createdAt: Date.now(),
                                            updatedAt: Date.now()
                                        };
                                        
                                        // Auto-populate seasons and episodes for the new series
                                        let epCounter = 0;
                                        const seasonsList = (details.seasons && details.seasons.length > 0)
                                            ? details.seasons.filter(sn => sn && sn.season_number > 0)
                                            : [{ season_number: 1 }];
                                        
                                        for (const sInfo of seasonsList) {
                                            const sNum = sInfo.season_number || 1;
                                            const sKey = String(sNum);
                                            tvData.seasons[sKey] = {
                                                seasonNumber: String(sNum),
                                                name: sInfo.name || ,
                                                overview: sInfo.overview || '',
                                                poster: sInfo.poster_path ?  : '',
                                                episodes: {}
                                            };
                                            
                                            try {
                                                const epRes = await fetch();
                                                if (epRes.ok) {
                                                    const epData = await epRes.json();
                                                    if (epData.episodes && Array.isArray(epData.episodes)) {
                                                        epData.episodes.forEach(ep => {
                                                            const eNum = ep.episode_number || 1;
                                                            tvData.seasons[sKey].episodes[String(eNum)] = {
                                                                episodeNumber: eNum,
                                                                title: ep.name || ('Episode ' + eNum),
                                                                overview: ep.overview || '',
                                                                still: ep.still_path ?  : '',
                                                                airDate: ep.air_date || '',
                                                                servers: window.generateTVEpisodeServers(candId, sNum, eNum)
                                                            };
                                                            epCounter++;
                                                        });
                                                    }
                                                }
                                            } catch(epErr) {
                                                console.warn(, epErr);
                                            }
                                        }
                                        
                                        if (Object.keys(tvData.seasons).length === 0 || epCounter === 0) {
                                            tvData.seasons["1"] = {
                                                seasonNumber: "1",
                                                episodes: {
                                                    "1": {
                                                        episodeNumber: 1,
                                                        title: "Episode 1",
                                                        servers: window.generateTVEpisodeServers(candId, 1, 1)
                                                    }
                                                }
                                            };
                                            epCounter = 1;
                                        }
                                        
                                        await set(ref(db, ), cleanFirebaseData(tvData));
                                        existingTVTmdb.add(candId);
                                        existingTVTitles.add(cleanTitle.toLowerCase());
                                        addedCount++;
                                        updateStatsDisplay();
                                        window.appendAutoUpdateLog(, 'success');
                                    }
                                    
                                    await new Promise(r => setTimeout(r, 60));
                                } catch(candErr) {
                                    errorCount++;
                                    updateStatsDisplay();
                                    window.appendAutoUpdateLog(, 'error');
                                }
                            }
                        } catch(feedErr) {
                            console.warn("Feed fetch error:", feedErr);
                        }
                    }
                }

                // ========================================================
                // PHASE 2: AUTO-ADD NEW/MISSING EPISODES TO EXISTING SHOWS
                // ========================================================
                if (shouldSyncEpisodes) {
                    setProgress(50, 'Checking existing TV series for new or missing episodes...');
                    window.appendAutoUpdateLog('📺 Scanning existing TV series for newly released episodes...', 'init');
                    
                    const tvEntries = Object.entries(tvShows || {});
                    for (let tIdx = 0; tIdx < tvEntries.length; tIdx++) {
                        const [dbKey, show] = tvEntries[tIdx];
                        if (!show || typeof show !== 'object') continue;
                        
                        let tmdbId = show.tmdbId || show.id;
                        if (!tmdbId && /^\d+$/.test(String(dbKey))) tmdbId = String(dbKey);
                        if (!tmdbId && /^(?:tv|t)_(\d+)$/.test(String(dbKey))) tmdbId = dbKey.match(/^(?:tv|t)_(\d+)$/)[1];
                        
                        if (!tmdbId || !/^[0-9]+$/.test(String(tmdbId))) continue;
                        
                        const showTitle = show.title || show.name || 'TV Series';
                        setProgress(50 + Math.round((tIdx / tvEntries.length) * 25), );
                        
                        try {
                            const tmdbShowRes = await fetch();
                            if (!tmdbShowRes.ok) continue;
                            const tmdbShowData = await tmdbShowRes.json();
                            
                            if (!show.seasons) show.seasons = {};
                            const seasonsList = (tmdbShowData.seasons || []).filter(sn => sn && sn.season_number > 0);
                            let newEpisodesAddedForShow = 0;
                            
                            for (const sInfo of seasonsList) {
                                const sNum = sInfo.season_number;
                                const sKey = String(sNum);
                                const expectedCount = sInfo.episode_count || 0;
                                
                                if (!show.seasons[sKey]) {
                                    show.seasons[sKey] = {
                                        seasonNumber: String(sNum),
                                        name: sInfo.name || ,
                                        overview: sInfo.overview || '',
                                        poster: sInfo.poster_path ?  : '',
                                        episodes: {}
                                    };
                                }
                                if (!show.seasons[sKey].episodes) show.seasons[sKey].episodes = {};
                                
                                const existingEpCount = Object.keys(show.seasons[sKey].episodes).length;
                                if (existingEpCount < expectedCount || s.autoServers !== false) {
                                    try {
                                        const epRes = await fetch();
                                        if (epRes.ok) {
                                            const epData = await epRes.json();
                                            if (epData.episodes && Array.isArray(epData.episodes)) {
                                                epData.episodes.forEach(ep => {
                                                    const eNum = ep.episode_number || 1;
                                                    const eKey = String(eNum);
                                                    const altKey = ;
                                                    const existingEp = show.seasons[sKey].episodes[eKey] || show.seasons[sKey].episodes[altKey];
                                                    
                                                    if (!existingEp) {
                                                        show.seasons[sKey].episodes[eKey] = {
                                                            episodeNumber: eNum,
                                                            title: ep.name || ('Episode ' + eNum),
                                                            overview: ep.overview || '',
                                                            still: ep.still_path ?  : '',
                                                            airDate: ep.air_date || '',
                                                            servers: window.generateTVEpisodeServers(tmdbId, sNum, eNum)
                                                        };
                                                        newEpisodesAddedForShow++;
                                                    } else {
                                                        // Ensure Vidout, xPass, and YTHD servers are present on existing episodes
                                                        if (!existingEp.servers) existingEp.servers = {};
                                                        const cleaned = {};
                                                        Object.entries(existingEp.servers).forEach(([k, sv]) => {
                                                            if (!window.isOldAutoEmbedServer(k, sv) && !['vidout', 'xpass', 'ythd'].includes(k)) {
                                                                cleaned[k] = sv;
                                                            }
                                                        });
                                                        Object.assign(cleaned, window.generateTVEpisodeServers(tmdbId, sNum, eNum));
                                                        existingEp.servers = cleaned;
                                                    }
                                                });
                                            }
                                        }
                                    } catch(epFetchErr) {}
                                }
                            }
                            
                            if (newEpisodesAddedForShow > 0) {
                                show.updatedAt = Date.now();
                                await set(ref(db, ), cleanFirebaseData(show));
                                updatedCount++;
                                updateStatsDisplay();
                                window.appendAutoUpdateLog(, 'update');
                            }
                        } catch(showCheckErr) {
                            console.warn("Episode check error for show:", showCheckErr);
                        }
                    }
                }

                // ========================================================
                // PHASE 3: REFRESH METADATA FOR EXISTING CATALOG (IF ENABLED)
                // ========================================================
                if (shouldUpdateExisting) {
                    setProgress(75, 'Updating existing catalog metadata & servers...');
                    window.appendAutoUpdateLog('🔄 Refreshing existing catalog titles (ratings, posters & modern servers)...', 'init');
                    
                    const catalogItems = [];
                    Object.entries(movies || {}).forEach(([k, m]) => {
                        if (m && typeof m === 'object') catalogItems.push({ _dbKey: k, _targetNode: 'movies', _type: 'movie', ...m });
                    });
                    Object.entries(tvShows || {}).forEach(([k, t]) => {
                        if (t && typeof t === 'object') catalogItems.push({ _dbKey: k, _targetNode: 'tvShows', _type: 'tv', ...t });
                    });
                    
                    const catTotal = catalogItems.length;
                    for (let cIdx = 0; cIdx < catTotal; cIdx++) {
                        const rawItem = catalogItems[cIdx];
                        const type = rawItem._type;
                        const targetNode = rawItem._targetNode;
                        const dbKey = rawItem._dbKey;
                        const title = rawItem.title || rawItem.name || 'Untitled';
                        
                        setProgress(75 + Math.round((cIdx / catTotal) * 20), );
                        
                        try {
                            let tmdbId = rawItem.tmdbId ? String(rawItem.tmdbId).trim() : '';
                            if (!tmdbId && rawItem.id && /^\d+$/.test(String(rawItem.id))) tmdbId = String(rawItem.id);
                            if (!tmdbId && dbKey && /^\d+$/.test(String(dbKey))) tmdbId = String(dbKey);
                            if (!tmdbId && dbKey && /^(?:movie|tv|m|t)_(\d+)$/.test(String(dbKey))) tmdbId = dbKey.match(/^(?:movie|tv|m|t)_(\d+)$/)[1];
                            
                            const updatedItem = { ...rawItem };
                            let details = null;
                            
                            if (tmdbId && !tmdbId.startsWith('tt')) {
                                try {
                                    const dRes = await fetch();
                                    if (dRes.ok) details = await dRes.json();
                                } catch(dErr) {}
                            }
                            
                            if (details) {
                                if (details.vote_average) updatedItem.rating = Number(details.vote_average).toFixed(1);
                                if (!updatedItem.backdrop && details.backdrop_path) updatedItem.backdrop = 'https://image.tmdb.org/t/p/w1280' + details.backdrop_path;
                                if (!updatedItem.poster && details.poster_path) updatedItem.poster = 'https://image.tmdb.org/t/p/w500' + details.poster_path;
                                if (!updatedItem.overview && details.overview) updatedItem.overview = details.overview;
                                if (tmdbId) updatedItem.tmdbId = tmdbId;
                                
                                const detectedNets = window.detectNetworksFromTMDB(details, type);
                                if (detectedNets && detectedNets.length > 0) {
                                    const existingArr = Array.isArray(updatedItem.networks) 
                                        ? updatedItem.networks.map(n => typeof n === 'string' ? n : (n && n.name ? n.name : '')).filter(Boolean)
                                        : (updatedItem.network ? updatedItem.network.split(',').map(s=>s.trim()).filter(Boolean) : []);
                                    const mergedNets = [...new Set([...existingArr, ...detectedNets])];
                                    updatedItem.networks = mergedNets.map(name => ({ name }));
                                    updatedItem.network = mergedNets.join(', ');
                                }
                            }
                            
                            // Ensure clean Vidout, xPass & YTHD servers
                            if (s.autoServers !== false && tmdbId) {
                                if (type === 'movie') {
                                    if (!updatedItem.servers) updatedItem.servers = {};
                                    const cleanedSrvs = {};
                                    Object.entries(updatedItem.servers).forEach(([k, sv]) => {
                                        if (!window.isOldAutoEmbedServer(k, sv) && !['srv_vidout', 'srv_xpass', 'srv_ythd'].includes(k)) {
                                            cleanedSrvs[k] = sv;
                                        }
                                    });
                                    Object.assign(cleanedSrvs, window.generateMovieServers(tmdbId, updatedItem.imdbId || ''));
                                    updatedItem.servers = cleanedSrvs;
                                } else if (type === 'tv' && updatedItem.seasons) {
                                    Object.keys(updatedItem.seasons).forEach(sNum => {
                                        const season = updatedItem.seasons[sNum];
                                        if (season && season.episodes) {
                                            Object.keys(season.episodes).forEach(eNum => {
                                                const ep = season.episodes[eNum];
                                                if (!ep) return;
                                                if (!ep.servers) ep.servers = {};
                                                const cleanedEpSrvs = {};
                                                Object.entries(ep.servers).forEach(([k, sv]) => {
                                                    if (!window.isOldAutoEmbedServer(k, sv) && !['vidout', 'xpass', 'ythd'].includes(k)) {
                                                        cleanedEpSrvs[k] = sv;
                                                    }
                                                });
                                                const cleanS = season.seasonNumber || sNum;
                                                const cleanE = ep.episodeNumber || eNum.replace(/^ep_/, '');
                                                Object.assign(cleanedEpSrvs, window.generateTVEpisodeServers(tmdbId, cleanS, cleanE));
                                                ep.servers = cleanedEpSrvs;
                                            });
                                        }
                                    });
                                }
                            }
                            
                            updatedItem.updatedAt = Date.now();
                            delete updatedItem._dbKey;
                            delete updatedItem._targetNode;
                            delete updatedItem._type;
                            
                            await set(ref(db, ), cleanFirebaseData(updatedItem));
                            updatedCount++;
                            updateStatsDisplay();
                        } catch(cErr) {
                            errorCount++;
                            updateStatsDisplay();
                        }
                    }
                }
                
                setProgress(100, 'Auto Update completed successfully!');
                
                const now = Date.now();
                const execSummary = {
                    timestamp: now,
                    added: addedCount,
                    updated: updatedCount,
                    skipped: skippedCount,
                    errors: errorCount,
                    status: errorCount === 0 ? 'Success' : 'Completed with warnings',
                    type: force ? 'Manual Run' : 'Scheduled'
                };
                
                window.currentAutoUpdateSettings.lastRun = now;
                window.currentAutoUpdateSettings.lastResult = execSummary;
                
                await set(ref(db, 'autoUpdateSettings'), cleanFirebaseData(window.currentAutoUpdateSettings));
                await push(ref(db, 'autoUpdateHistory'), cleanFirebaseData(execSummary));
                await set(ref(db, 'settings/lastContentUpdate'), now);
                
                updateAutoUpdateUIStats();
                loadAutoUpdateHistory();
                
                if (typeof loadDashboard === 'function') loadDashboard();
                if (typeof loadContentList === 'function') {
                    loadContentList('movie');
                    loadContentList('tv');
                }
                
                window.appendAutoUpdateLog(, 'success');
                
                if (!isBackground) {
                    setTimeout(() => {
                        alert();
                    }, 300);
                }
            } catch(globalErr) {
                window.appendAutoUpdateLog('Fatal error during sync: ' + globalErr.message, 'error');
                alert('Auto Update Engine Error: ' + globalErr.message);
            } finally {
                window.isAutoUpdating = false;
                if (runBtn) {
                    runBtn.disabled = false;
                    runBtn.innerHTML = '<i class="fas fa-sync-alt mr-1.5"></i> Run Full Auto Update';
                }
                if (dashBtn) {
                    dashBtn.disabled = false;
                    dashBtn.innerHTML = '<i class="fas fa-bolt"></i> Run Auto Update Now';
                }
            }
        };
