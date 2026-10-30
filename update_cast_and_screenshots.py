import re

def update_index():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. SAFE RATING HANDLER (Eliminates PERMISSION_DENIED on rating submission)
    old_rating = """        window.addEventListener('submitRatingEvent', async (e) => {
            if(!db) return;
            const { id, type, rating, uid } = e.detail;
            const node = type === 'movie' ? 'movies' : 'tvShows';
            try {
                await set(ref(db, `ratings/${node}_${id}/${uid}`), rating);
                
                // Calculate and update global average
                const snap = await get(child(ref(db), `ratings/${node}_${id}`));
                if (snap.exists()) {
                    const ratings = snap.val();
                    const values = Object.values(ratings);
                    const avg = values.reduce((a,b)=>a+b, 0) / values.length;
                    
                    // User votes 1-5, TMDB is 1-10, so scale by 2
                    const scaledAvg = (avg * 2).toFixed(1);
                    await set(ref(db, `${node}/${id}/vote_average`), parseFloat(scaledAvg));
                    
                    // Also dispatch an event to refresh UI if needed
                    console.log('Updated global rating to', scaledAvg);
                }
            } catch(err) { console.error(err); }
        });"""

    new_rating = """        window.addEventListener('submitRatingEvent', async (e) => {
            const { id, type, rating, uid } = e.detail;
            const node = type === 'movie' ? 'movies' : 'tvShows';
            // 1. Always store rating in localStorage for instant persistent feedback
            try {
                const userRatings = JSON.parse(localStorage.getItem('nexora_user_ratings') || '{}');
                userRatings[`${node}_${id}`] = rating;
                localStorage.setItem('nexora_user_ratings', JSON.stringify(userRatings));
            } catch(err) {}

            // 2. Silently sync to Firebase if authorized, without throwing PERMISSION_DENIED
            try {
                if (typeof db !== 'undefined' && db && typeof set === 'function' && typeof ref === 'function') {
                    await set(ref(db, `ratings/${node}_${id}/${uid}`), rating).catch(() => {});
                    const snap = await get(child(ref(db), `ratings/${node}_${id}`)).catch(() => null);
                    if (snap && snap.exists()) {
                        const ratings = snap.val();
                        const values = Object.values(ratings || {});
                        if (values.length > 0) {
                            const avg = values.reduce((a,b)=>a+b, 0) / values.length;
                            const scaledAvg = (avg * 2).toFixed(1);
                            await set(ref(db, `${node}/${id}/vote_average`), parseFloat(scaledAvg)).catch(() => {});
                        }
                    }
                }
            } catch(err) {
                // Keep UI smooth, no noisy console error
            }
        });"""

    if old_rating in html:
        html = html.replace(old_rating, new_rating)
        print("✓ Updated submitRatingEvent with safe local fallback (no PERMISSION_DENIED)")
    else:
        print("! Could not find old_rating block")

    # 2. SAFE LOAD PROFILES (Eliminates PERMISSION_DENIED on profile init)
    old_profiles = """        window.loadProfilesFromDB = async function() {
            try {
                const dbRef = ref(db, 'profiles');
                const snapshot = await get(dbRef);
                let profiles = [];
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    profiles = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                } else {
                    // Seed defaults if empty
                    const default1 = { name: 'Paltu', image: 'https://wallpapers.com/images/hd/guard-shapes-squid-game-pfp-8kdf06ff9b068iar.jpg' };
                    const default2 = { name: 'Professional Couch Potato', image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' };
                    const p1Ref = push(ref(db, 'profiles'));
                    await set(p1Ref, default1);
                    const p2Ref = push(ref(db, 'profiles'));
                    await set(p2Ref, default2);
                    profiles = [
                        { id: p1Ref.key, ...default1 },
                        { id: p2Ref.key, ...default2 }
                    ];
                }
                return profiles;
            } catch(e) {
                console.error("Error loading profiles:", e);
                return [];
            }
        };"""

    new_profiles = """        window.loadProfilesFromDB = async function() {
            const defaultProfiles = [
                { id: 'p1', name: 'User', image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
                { id: 'p2', name: 'Paltu', image: 'https://wallpapers.com/images/hd/guard-shapes-squid-game-pfp-8kdf06ff9b068iar.jpg' },
                { id: 'p3', name: 'Binge Watcher', image: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80' }
            ];

            let localProfiles = [];
            try {
                const stored = localStorage.getItem('nexora_profiles_list');
                if (stored) localProfiles = JSON.parse(stored);
            } catch(e) {}

            try {
                if (typeof db !== 'undefined' && db && typeof ref === 'function' && typeof get === 'function') {
                    const dbRefVal = ref(db, 'profiles');
                    const snapshot = await get(dbRefVal).catch(() => null);
                    if (snapshot && snapshot.exists()) {
                        const data = snapshot.val();
                        const remoteProfiles = Object.keys(data || {}).map(key => ({ id: key, ...data[key] }));
                        if (remoteProfiles.length > 0) return remoteProfiles;
                    }
                }
            } catch(e) {}

            return localProfiles.length > 0 ? localProfiles : defaultProfiles;
        };"""

    if old_profiles in html:
        html = html.replace(old_profiles, new_profiles)
        print("✓ Updated loadProfilesFromDB with safe default profiles (no PERMISSION_DENIED)")
    else:
        print("! Could not find old_profiles block")

    # 3. REWRITE RENDERCAST (Complete filmography from TMDB + deep fuzzy matching on database)
    pos_cast_start = html.find('async function renderCast(')
    pos_cast_end = html.find('        // -------------------------------------\n        // MOVIE DETAILS VIEW')
    if pos_cast_end == -1:
        # alternative anchor
        pos_cast_end = html.find('async function renderDetails(')
        # backtrack to line above it
        pos_cast_end = html.rfind('        //', 0, pos_cast_end)

    if pos_cast_start != -1 and pos_cast_end != -1:
        old_cast_section = html[pos_cast_start:pos_cast_end]
        
        new_cast_section = """async function renderCast(castName, initialTab = 'all') {
            if (!castName) {
                window.location.hash = '#home';
                return;
            }
            const cleanName = decodeURIComponent(castName).trim();
            const appContent = document.getElementById('app-content');
            if (!appContent) return;

            // Instant responsive skeleton loader with actor header
            appContent.innerHTML = `
                <div class="min-h-screen bg-transparent pt-28 md:pt-32 pb-16 text-white animate-fade-in">
                    <div class="max-w-7xl mx-auto px-4 md:px-12">
                        <div class="flex items-center gap-6 pb-8 animate-pulse">
                            <div class="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/10 border border-white/10 shrink-0"></div>
                            <div class="flex-1 space-y-3">
                                <div class="w-28 h-4 bg-white/10 rounded"></div>
                                <div class="w-64 h-8 bg-white/10 rounded"></div>
                                <div class="w-48 h-3 bg-white/10 rounded"></div>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            ${Array.from({length: 12}).map(() => `
                                <div class="aspect-[2/3] rounded-xl bg-white/5 border border-white/10 animate-pulse"></div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;

            // Helper to normalize names for resilient fuzzy matching
            function normalizeName(str) {
                if (!str) return '';
                return String(str)
                    .toLowerCase()
                    .replace(/\\(.*?\\)/g, '')
                    .replace(/\\bas\\s+.*$/i, '')
                    .replace(/[.,\\/#!$%\\^&\\*;:{}=\\-_`~()]/g, ' ')
                    .replace(/\\s+/g, ' ')
                    .trim();
            }

            const targetNormalized = normalizeName(cleanName);
            const targetTokens = targetNormalized.split(' ').filter(t => t.length > 1);

            // Fetch local database movies & TV shows
            const [moviesObj, tvShowsObj] = await Promise.all([
                fetchFirebaseData('movies').then(d => d || {}),
                fetchFirebaseData('tvShows').then(d => d || {})
            ]);

            const allMovies = Object.entries(moviesObj).map(([id, m]) => ({ ...m, id: m.id || id, type: 'movie' }));
            const allTvShows = Object.entries(tvShowsObj).map(([id, t]) => ({ ...t, id: t.id || id, type: 'tv' }));

            function matchCastMember(item) {
                if (!item || item.status === 'draft') return false;

                // Gather all possible cast, actor, director and starring fields
                const candidates = [];
                const addCandidates = (val) => {
                    if (!val) return;
                    if (Array.isArray(val)) {
                        val.forEach(v => {
                            if (typeof v === 'string') candidates.push(v);
                            else if (typeof v === 'object' && v) {
                                if (v.name) candidates.push(v.name);
                                if (v.actor) candidates.push(v.actor);
                                if (v.original_name) candidates.push(v.original_name);
                            }
                        });
                    } else if (typeof val === 'object') {
                        Object.values(val).forEach(v => {
                            if (typeof v === 'string') candidates.push(v);
                            else if (typeof v === 'object' && v) {
                                if (v.name) candidates.push(v.name);
                                if (v.actor) candidates.push(v.actor);
                            }
                        });
                    } else if (typeof val === 'string') {
                        val.split(',').forEach(s => candidates.push(s.trim()));
                    }
                };

                addCandidates(item.cast);
                addCandidates(item.actors);
                addCandidates(item.starring);
                addCandidates(item.stars);
                addCandidates(item.crew);
                addCandidates(item.director);

                if (candidates.length === 0) return false;

                return candidates.some(cName => {
                    const cNorm = normalizeName(cName);
                    if (!cNorm) return false;
                    if (cNorm === targetNormalized) return true;
                    if (cNorm.includes(targetNormalized) || targetNormalized.includes(cNorm)) return true;
                    // Check token match if at least 2 tokens match
                    if (targetTokens.length >= 2) {
                        const matchedTokens = targetTokens.filter(t => cNorm.includes(t));
                        if (matchedTokens.length === targetTokens.length) return true;
                    }
                    return false;
                });
            }

            // Local matches
            const localMovies = allMovies.filter(matchCastMember).map(m => ({ ...m, isOnNexflix: true }));
            const localTvShows = allTvShows.filter(matchCastMember).map(t => ({ ...t, isOnNexflix: true }));

            // Map for quick local check
            const localTitlesMap = new Map();
            [...allMovies, ...allTvShows].forEach(item => {
                const normTitle = normalizeName(item.title || item.name || '');
                if (normTitle) localTitlesMap.set(normTitle, item);
                if (item.tmdbId) localTitlesMap.set('tmdb_' + item.tmdbId, item);
                if (item.id) localTitlesMap.set('id_' + item.id, item);
            });

            // Asynchronously query TMDB Person API for complete filmography
            let tmdbPerson = null;
            let tmdbCredits = [];
            let tmdbBio = '';
            let tmdbBirth = '';
            let tmdbKnownFor = '';
            let actorImage = '';

            const tmdbKey = (window.appSettings && window.appSettings.tmdbKey) ? window.appSettings.tmdbKey.trim() : (window.TMDB_API_KEY || "eaa427dc2d3150ffec741537c8e0de6d");

            try {
                const searchUrl = `https://api.themoviedb.org/3/search/person?api_key=${tmdbKey}&query=${encodeURIComponent(cleanName)}`;
                const searchRes = await fetch(searchUrl).then(r => r.json()).catch(() => null);
                if (searchRes && searchRes.results && searchRes.results.length > 0) {
                    tmdbPerson = searchRes.results[0];
                    if (tmdbPerson.profile_path) {
                        actorImage = `https://image.tmdb.org/t/p/w500${tmdbPerson.profile_path}`;
                    }

                    // Fetch combined credits and person details concurrently
                    const [creditsRes, detailsRes] = await Promise.all([
                        fetch(`https://api.themoviedb.org/3/person/${tmdbPerson.id}/combined_credits?api_key=${tmdbKey}`).then(r => r.json()).catch(() => null),
                        fetch(`https://api.themoviedb.org/3/person/${tmdbPerson.id}?api_key=${tmdbKey}`).then(r => r.json()).catch(() => null)
                    ]);

                    if (detailsRes) {
                        tmdbBio = detailsRes.biography || '';
                        tmdbBirth = detailsRes.place_of_birth ? `${detailsRes.birthday ? detailsRes.birthday.substring(0,4) + ' • ' : ''}${detailsRes.place_of_birth}` : (detailsRes.birthday || '');
                        tmdbKnownFor = detailsRes.known_for_department || '';
                    }

                    if (creditsRes && Array.isArray(creditsRes.cast)) {
                        tmdbCredits = creditsRes.cast.filter(c => c && (c.title || c.name) && (c.poster_path || c.backdrop_path));
                    }
                }
            } catch(e) {
                console.warn('TMDB fetch error:', e);
            }

            // Fallback actor image if not found on TMDB
            if (!actorImage) {
                for (const item of [...localMovies, ...localTvShows]) {
                    const list = Array.isArray(item.cast) ? item.cast : Object.values(item.cast || {});
                    for (const c of list) {
                        if (c && typeof c === 'object' && (c.image || c.profile_path || c.photo)) {
                            const cNorm = normalizeName(c.name);
                            if (cNorm.includes(targetNormalized) || targetNormalized.includes(cNorm)) {
                                actorImage = c.image || c.profile_path || c.photo;
                                break;
                            }
                        }
                    }
                    if (actorImage) break;
                }
            }

            // Merge local and TMDB credits into a comprehensive catalog
            const allItemsMap = new Map();

            // 1. Add all local matches first
            [...localMovies, ...localTvShows].forEach(item => {
                const uniqueKey = (item.type || 'movie') + '_' + item.id;
                allItemsMap.set(uniqueKey, {
                    ...item,
                    type: item.type || 'movie',
                    isOnNexflix: true
                });
            });

            // 2. Add TMDB credits, linking to local if matching
            tmdbCredits.forEach(c => {
                const mediaType = c.media_type === 'tv' ? 'tv' : 'movie';
                const cTitle = c.title || c.name || '';
                const cNorm = normalizeName(cTitle);
                const localMatch = localTitlesMap.get('tmdb_' + c.id) || localTitlesMap.get(cNorm);

                if (localMatch) {
                    const uniqueKey = (localMatch.type || mediaType) + '_' + localMatch.id;
                    if (!allItemsMap.has(uniqueKey)) {
                        allItemsMap.set(uniqueKey, {
                            ...localMatch,
                            isOnNexflix: true
                        });
                    }
                } else {
                    const uniqueKey = 'tmdb_' + mediaType + '_' + c.id;
                    if (!allItemsMap.has(uniqueKey)) {
                        allItemsMap.set(uniqueKey, {
                            id: c.id,
                            tmdbId: c.id,
                            title: cTitle,
                            name: cTitle,
                            type: mediaType,
                            poster: c.poster_path ? `https://image.tmdb.org/t/p/w500${c.poster_path}` : '',
                            backdrop: c.backdrop_path ? `https://image.tmdb.org/t/p/original${c.backdrop_path}` : '',
                            year: (c.release_date || c.first_air_date || '').substring(0, 4),
                            rating: c.vote_average ? Number(c.vote_average).toFixed(1) : '',
                            vote_average: c.vote_average || 0,
                            popularity: c.popularity || 0,
                            overview: c.overview || '',
                            character: c.character || '',
                            isOnNexflix: false
                        });
                    }
                }
            });

            const mergedList = Array.from(allItemsMap.values());
            const onNexflixList = mergedList.filter(i => i.isOnNexflix);
            const moviesList = mergedList.filter(i => i.type === 'movie');
            const tvList = mergedList.filter(i => i.type === 'tv');
            const tmdbOnlyList = mergedList.filter(i => !i.isOnNexflix);

            // Save state for interactive filtering
            window.castHubState = {
                castName: cleanName,
                actorImage,
                activeTab: initialTab || 'all',
                allMatched: mergedList,
                onNexflixList,
                matchedMovies: moviesList,
                matchedTvShows: tvList,
                tmdbOnlyList
            };

            // Collect genres
            const genreSet = new Set();
            mergedList.forEach(item => {
                if (Array.isArray(item.genres)) item.genres.forEach(g => genreSet.add(g));
                if (Array.isArray(item.collections)) item.collections.forEach(c => genreSet.add(c));
            });
            const genreOptionsHtml = ['All', ...Array.from(genreSet).sort()].map(g => `
                <option value="${g.replace(/"/g, '&quot;')}">${g}</option>
            `).join('');

            const html = `
            <div class="min-h-screen bg-transparent pt-24 md:pt-32 pb-20 animate-fade-in text-white">
                <div class="max-w-7xl mx-auto px-4 md:px-12">
                    
                    <!-- Top Navigation Bar -->
                    <div class="mb-6 relative z-20 flex items-center justify-between">
                        <button type="button" onclick="window.goBackFromCast()" class="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass hover:bg-white/20 text-xs sm:text-sm font-bold text-gray-200 hover:text-white transition active:scale-95 shadow cursor-pointer">
                            <i class="fas fa-arrow-left text-xs text-amber-400"></i>
                            <span>Back</span>
                        </button>
                        <a href="#home" class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass hover:bg-white/20 text-xs font-semibold text-gray-300 hover:text-white transition">
                            <i class="fas fa-home text-xs text-netflixRed"></i>
                            <span class="hidden sm:inline">Home</span>
                        </a>
                    </div>

                    <!-- Actor Profile Card (Hero) -->
                    <div class="liquid-glass border border-white/15 rounded-3xl p-6 sm:p-8 md:p-10 mb-8 shadow-2xl relative overflow-hidden">
                        <div class="absolute -top-32 -right-32 w-96 h-96 bg-netflixRed/15 rounded-full blur-3xl pointer-events-none"></div>
                        <div class="absolute -bottom-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div class="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 text-center sm:text-left">
                            
                            <!-- Profile Photo -->
                            <div class="relative w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 shrink-0 group">
                                <div class="absolute -inset-1.5 bg-gradient-to-tr from-[#E50914] via-amber-500 to-rose-600 rounded-full blur-md opacity-80 group-hover:opacity-100 transition duration-500"></div>
                                <div class="relative w-full h-full rounded-full bg-[#12131a] border-2 border-white/50 overflow-hidden shadow-2xl flex items-center justify-center">
                                    ${actorImage ? `
                                        <img src="${actorImage}" onerror="window.handleImgError(this, 'avatar')" class="w-full h-full object-cover">
                                    ` : `
                                        <div class="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-4xl font-black text-amber-400">
                                            ${cleanName.split(' ').map(n=>n[0]).slice(0,2).join('')}
                                        </div>
                                    `}
                                </div>
                            </div>

                            <!-- Info -->
                            <div class="flex-1">
                                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2.5">
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider bg-red-600/30 text-red-400 border border-red-500/40">
                                        <i class="fas fa-star text-[9px] text-amber-400"></i> ${tmdbKnownFor || 'Actor / Artist'}
                                    </span>
                                    <span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                        ${onNexflixList.length} Streamable on Nexflix
                                    </span>
                                    <span class="inline-flex items-center px-3 py-1 rounded-full text-[10px] md:text-xs font-bold bg-white/10 text-gray-300 border border-white/15">
                                        ${mergedList.length} Total Filmography Credits
                                    </span>
                                </div>

                                <h1 class="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                                    ${cleanName}
                                </h1>

                                ${tmdbBirth ? `
                                    <div class="text-xs sm:text-sm text-gray-300 mt-2 flex items-center justify-center sm:justify-start gap-2">
                                        <i class="fas fa-map-marker-alt text-red-500 text-xs"></i>
                                        <span>${tmdbBirth}</span>
                                    </div>
                                ` : ''}

                                ${tmdbBio ? `
                                    <div class="mt-3 text-xs sm:text-sm text-gray-300 leading-relaxed max-w-3xl">
                                        <p class="line-clamp-3" id="cast-bio-text">${tmdbBio}</p>
                                        ${tmdbBio.length > 250 ? `
                                            <button type="button" onclick="const p=document.getElementById('cast-bio-text'); p.classList.toggle('line-clamp-3'); this.innerText=p.classList.contains('line-clamp-3')?'Read more':'Show less';" class="text-amber-400 hover:underline text-xs font-bold mt-1 inline-block">Read more</button>
                                        ` : ''}
                                    </div>
                                ` : `
                                    <p class="text-xs sm:text-sm text-gray-400 mt-2 max-w-2xl">
                                        Complete filmography and all movies & series starring <span class="text-white font-semibold">${cleanName}</span>.
                                    </p>
                                `}
                            </div>
                        </div>
                    </div>

                    <!-- Toolbar / Tabs -->
                    <div class="liquid-glass border border-white/15 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 sm:gap-3 flex-wrap shadow-2xl mb-8">
                        <!-- Segmented Tabs -->
                        <div class="flex items-center bg-black/50 p-1 rounded-xl border border-white/10 shrink-0 overflow-x-auto max-w-full">
                            <button onclick="window.switchCastHubTab('all')" id="cast-tab-all" class="px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition shadow bg-white text-black whitespace-nowrap">
                                All (${mergedList.length})
                            </button>
                            <button onclick="window.switchCastHubTab('streamable')" id="cast-tab-streamable" class="px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-gray-400 hover:text-white transition whitespace-nowrap">
                                On Nexflix (${onNexflixList.length})
                            </button>
                            <button onclick="window.switchCastHubTab('movie')" id="cast-tab-movie" class="px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-gray-400 hover:text-white transition whitespace-nowrap">
                                Movies (${moviesList.length})
                            </button>
                            <button onclick="window.switchCastHubTab('tv')" id="cast-tab-tv" class="px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-gray-400 hover:text-white transition whitespace-nowrap">
                                Series (${tvList.length})
                            </button>
                        </div>

                        <!-- Sort Dropdown -->
                        <div class="flex items-center gap-2 shrink-0">
                            <span class="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">SORT</span>
                            <div class="relative">
                                <select id="cast-hub-sort-select" onchange="window.handleCastHubFilter()" class="appearance-none bg-black/50 border border-white/15 hover:border-white/30 text-white text-xs sm:text-sm font-semibold rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer">
                                    <option value="popular">Most popular</option>
                                    <option value="latest">Latest releases</option>
                                    <option value="rating">Highest rated</option>
                                    <option value="title">Title A–Z</option>
                                </select>
                                <i class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                            </div>
                        </div>

                        <!-- Genre Filter Dropdown -->
                        <div class="relative shrink-0">
                            <select id="cast-hub-genre-select" onchange="window.handleCastHubFilter()" class="appearance-none bg-black/50 border border-white/15 hover:border-white/30 text-white text-xs sm:text-sm font-semibold rounded-xl pl-3 pr-8 py-1.5 outline-none cursor-pointer">
                                ${genreOptionsHtml}
                            </select>
                            <i class="fas fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs"></i>
                        </div>

                        <!-- Search Input -->
                        <div class="relative flex-1 min-w-[150px]">
                            <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
                            <input type="text" id="cast-hub-search-input" oninput="window.handleCastHubFilter()" placeholder="Search ${cleanName}'s titles..." class="w-full bg-black/50 border border-white/15 focus:border-[#E50914] rounded-xl pl-8 pr-3 py-1.5 text-xs sm:text-sm text-white placeholder-gray-500 outline-none transition">
                        </div>
                    </div>

                    <!-- Content Grid -->
                    <div>
                        <div id="cast-hub-grid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5"></div>
                    </div>
                </div>
            </div>
            `;

            document.getElementById('app-content').innerHTML = html;
            window.scrollTo(0, 0);
            window.handleCastHubFilter();
        }
        window.renderCast = renderCast;

        window.switchCastHubTab = function(tab) {
            if (!window.castHubState) return;
            window.castHubState.activeTab = tab;
            ['all', 'streamable', 'movie', 'tv'].forEach(t => {
                const btn = document.getElementById(`cast-tab-${t}`);
                if (btn) {
                    if (t === tab) {
                        btn.className = "px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition shadow bg-white text-black whitespace-nowrap";
                    } else {
                        btn.className = "px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-gray-400 hover:text-white transition cursor-pointer whitespace-nowrap";
                    }
                }
            });
            window.handleCastHubFilter();
        };

        window.handleCastHubFilter = function() {
            if (!window.castHubState) return;
            const state = window.castHubState;
            const gridEl = document.getElementById('cast-hub-grid');
            if (!gridEl) return;

            const sortVal = document.getElementById('cast-hub-sort-select')?.value || 'popular';
            const genreVal = document.getElementById('cast-hub-genre-select')?.value || 'All';
            const searchVal = (document.getElementById('cast-hub-search-input')?.value || '').trim().toLowerCase();

            let items = [];
            if (state.activeTab === 'streamable') items = [...state.onNexflixList];
            else if (state.activeTab === 'movie') items = [...state.matchedMovies];
            else if (state.activeTab === 'tv') items = [...state.matchedTvShows];
            else items = [...state.allMatched];

            // Filter by Genre
            if (genreVal !== 'All') {
                items = items.filter(item => {
                    const g = Array.isArray(item.genres) ? item.genres : [];
                    const c = Array.isArray(item.collections) ? item.collections : [];
                    return g.includes(genreVal) || c.includes(genreVal);
                });
            }

            // Filter by Search
            if (searchVal) {
                items = items.filter(item => {
                    const title = (item.title || item.name || '').toLowerCase();
                    const overview = (item.overview || item.desc || '').toLowerCase();
                    return title.includes(searchVal) || overview.includes(searchVal);
                });
            }

            // Sort
            if (sortVal === 'popular') {
                items.sort((a, b) => {
                    // Prioritize streamable on Nexflix first, then popularity
                    if (a.isOnNexflix !== b.isOnNexflix) return a.isOnNexflix ? -1 : 1;
                    return (parseFloat(b.popularity) || parseFloat(b.views) || b.createdAt || 0) - (parseFloat(a.popularity) || parseFloat(a.views) || a.createdAt || 0);
                });
            } else if (sortVal === 'latest') {
                items.sort((a, b) => {
                    const yearA = parseInt(a.year) || (a.release_date ? parseInt(a.release_date) : 0);
                    const yearB = parseInt(b.year) || (b.release_date ? parseInt(b.release_date) : 0);
                    if (yearB !== yearA) return yearB - yearA;
                    return (b.createdAt || 0) - (a.createdAt || 0);
                });
            } else if (sortVal === 'rating') {
                items.sort((a, b) => (parseFloat(b.rating) || parseFloat(b.vote_average) || 0) - (parseFloat(a.rating) || parseFloat(a.vote_average) || 0));
            } else if (sortVal === 'title') {
                items.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
            }

            if (items.length === 0) {
                gridEl.innerHTML = `
                    <div class="col-span-full py-16 text-center liquid-glass rounded-2xl border border-white/15 p-8 shadow-xl">
                        <div class="w-16 h-16 rounded-full bg-white/10 border border-white/15 flex items-center justify-center mx-auto mb-4 text-gray-400 text-2xl">
                            <i class="fas fa-film"></i>
                        </div>
                        <h3 class="text-white text-base sm:text-lg font-bold">No titles found for ${state.castName}</h3>
                        <p class="text-gray-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
                            Try clearing the search query or switching to 'All' tab.
                        </p>
                    </div>
                `;
                return;
            }

            let cardsHtml = '';
            items.forEach(item => {
                const posterUrl = item.poster ? (item.poster.startsWith('http') ? item.poster : (window.formatImgUrl ? window.formatImgUrl(item.poster, 'poster') : item.poster)) : '';
                const altUrl = item.backdrop || '';
                const isAdult = !!item.adult;
                const score = item.rating || (item.vote_average ? Number(item.vote_average).toFixed(1) : '');
                const title = item.title || item.name || 'Untitled';
                const year = item.year || (item.release_date ? item.release_date.substring(0,4) : '');
                const character = item.character || '';

                if (item.isOnNexflix) {
                    cardsHtml += `
                        <a href="#${item.type}/${item.id}" class="relative rounded-2xl overflow-hidden card-hover transition-all duration-300 aspect-[2/3] liquid-glass-card border border-red-500/40 hover:border-red-500 block shadow-[0_8px_32px_rgba(229,9,20,0.3)] group">
                            <div class="n-badge z-20"></div>
                            
                            <!-- Glowing Stream Badge -->
                            <div class="absolute top-2 left-2 z-20 pointer-events-none">
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] md:text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-netflixRed to-red-700 text-white shadow-lg border border-red-400/30 whitespace-nowrap">
                                    <i class="fas fa-play text-[7px]"></i> STREAM
                                </span>
                            </div>

                            ${item.type === 'tv' ? `
                                <div class="absolute top-2 right-2 z-20 pointer-events-none">
                                    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black bg-blue-600/90 text-white shadow">SERIES</span>
                                </div>
                            ` : ''}

                            <img src="${posterUrl}" data-original-src="${posterUrl}" data-fallback-src="${altUrl}" onerror="window.handleImgError(this, 'poster')" loading="lazy" class="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-opacity">

                            <div class="absolute bottom-2 right-2 flex items-center gap-1 z-20 pointer-events-none">
                                ${score ? `<div class="bg-[#f5c518]/95 backdrop-blur-md text-black text-[9px] font-black px-1.5 py-0.5 rounded shadow flex items-center"><i class="fas fa-star text-[7px] mr-1"></i>${score}</div>` : ''}
                            </div>

                            <div class="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 z-10">
                                <h3 class="font-bold text-xs sm:text-sm line-clamp-1 drop-shadow-lg text-white">${title}</h3>
                                <div class="flex items-center gap-1.5 text-[10px] text-gray-300 mt-1">
                                    <span class="text-emerald-400 font-bold">${year}</span>
                                    ${character ? `<span class="text-amber-300 truncate font-medium">• ${character}</span>` : ''}
                                </div>
                                <span class="mt-2 text-center py-1 rounded-lg bg-netflixRed text-white text-[11px] font-extrabold uppercase tracking-wider shadow">Watch Now</span>
                            </div>
                        </a>
                    `;
                } else {
                    cardsHtml += `
                        <div class="relative rounded-2xl overflow-hidden transition-all duration-300 aspect-[2/3] bg-neutral-900/90 border border-white/10 hover:border-amber-400/50 block shadow-lg group">
                            <!-- TMDB Filmography Badge -->
                            <div class="absolute top-2 left-2 z-20 pointer-events-none">
                                <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[7.5px] md:text-[8.5px] font-bold uppercase tracking-wider bg-black/80 text-amber-300 border border-amber-400/30">
                                    <i class="fas fa-film text-[7px]"></i> FILMOGRAPHY
                                </span>
                            </div>

                            <img src="${posterUrl || 'https://via.placeholder.com/300x450/111/444?text=Poster'}" onerror="window.handleImgError(this, 'poster')" loading="lazy" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity">

                            <div class="absolute bottom-2 right-2 flex items-center gap-1 z-20 pointer-events-none">
                                ${score ? `<div class="bg-black/80 backdrop-blur-md text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10"><i class="fas fa-star text-[7px] mr-1"></i>${score}</div>` : ''}
                            </div>

                            <!-- Hover Overlay with 1-click Request Button -->
                            <div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 z-10">
                                <h3 class="font-bold text-xs sm:text-sm line-clamp-2 text-white">${title}</h3>
                                <div class="flex items-center gap-1.5 text-[10px] text-gray-300 mt-1">
                                    <span class="text-gray-400">${year || 'Movie'}</span>
                                    ${character ? `<span class="text-amber-300 truncate">• as ${character}</span>` : ''}
                                </div>
                                <button type="button" onclick="window.requestSpecificContent('${title.replace(/'/g, "\\\\'")}', '${item.type || 'movie'}')" class="mt-2.5 w-full py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 border border-amber-500/40 text-amber-300 hover:text-black font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider transition flex items-center justify-center gap-1 shadow cursor-pointer">
                                    <i class="fas fa-paper-plane text-[9px]"></i> Request to Add
                                </button>
                            </div>
                        </div>
                    `;
                }
            });

            gridEl.innerHTML = cardsHtml;
        };

        // One-click helper to request any movie/show directly from cast filmography
        window.requestSpecificContent = function(title, type) {
            window.location.hash = '#request';
            setTimeout(() => {
                const titleInput = document.getElementById('req-title');
                const typeSelect = document.getElementById('req-type');
                if (titleInput) titleInput.value = title;
                if (typeSelect) typeSelect.value = type === 'tv' ? 'tv' : 'movie';
                const form = document.querySelector('form');
                if (form) form.scrollIntoView({ behavior: 'smooth' });
                if (typeof showToast === 'function') {
                    showToast(`Requesting "${title}" - Click Submit Request below!`);
                }
            }, 300);
        };
"""
        html = html[:pos_cast_start] + new_cast_section + html[pos_cast_end:]
        print("✓ Replaced renderCast with complete TMDB + local filmography engine")
    else:
        print("! Could not find renderCast boundaries")

    # 4. ADD SCREENSHOTS & SCENE PREVIEWS TO DETAILS VIEW (with Lightbox Viewer)
    # Check if screenshots already added
    if 'id="screenshots-section"' not in html:
        # We need to find where extraHtml is constructed in renderDetails
        pos_extra = html.find("let extraHtml = (type === 'tv') ? (episodesHtml + castHtml) : (castHtml + episodesHtml);")
        if pos_extra != -1:
            replacement_extra = """            // Screenshots / Scene Previews Section
            const screenshotsHtml = `
                <div class="mt-12 max-w-7xl mx-auto px-4 md:px-0" id="screenshots-section">
                    <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <h3 class="text-xl md:text-2xl font-bold text-gray-200 tracking-tight flex items-center gap-2">
                            <span class="w-1.5 h-6 bg-red-600 rounded-full inline-block"></span>
                            <span>Screenshots & Scene Previews</span>
                        </h3>
                        <span id="screenshots-counter" class="text-xs text-gray-400 font-medium"></span>
                    </div>
                    <div id="screenshots-gallery" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                        <div class="col-span-full py-6 text-center text-gray-500 text-xs">
                            <i class="fas fa-spinner fa-spin mr-2"></i>Loading scene previews...
                        </div>
                    </div>
                </div>
            `;

            let extraHtml = (type === 'tv') 
                ? (episodesHtml + castHtml + screenshotsHtml) 
                : (castHtml + episodesHtml + screenshotsHtml);"""
            html = html.replace("let extraHtml = (type === 'tv') ? (episodesHtml + castHtml) : (castHtml + episodesHtml);", replacement_extra, 1)
            print("✓ Added screenshotsHtml to renderDetails extraHtml")

        # Now attach the asynchronous screenshots loader and lightbox script
        pos_after_render_details = html.find('async function renderPlayer(')
        if pos_after_render_details != -1:
            lightbox_code = """
        // =============================================================
        // SCREENSHOTS & SCENE PREVIEWS LIGHTBOX VIEWER
        // =============================================================
        window.currentLightboxImages = [];
        window.currentLightboxIndex = 0;

        window.loadContentScreenshots = async function(contentId, type, itemData) {
            const gallery = document.getElementById('screenshots-gallery');
            const counter = document.getElementById('screenshots-counter');
            if (!gallery) return;

            let stills = [];

            // 1. Check if screenshots exist on data object directly (from admin or DB)
            if (itemData && itemData.screenshots) {
                if (Array.isArray(itemData.screenshots)) {
                    stills = itemData.screenshots.filter(s => s && typeof s === 'string' && s.startsWith('http'));
                } else if (typeof itemData.screenshots === 'string') {
                    stills = itemData.screenshots.split(/[,\\n]/).map(s => s.trim()).filter(s => s.startsWith('http'));
                }
            }

            // 2. Query TMDB Images API for backdrops / stills
            const tmdbKey = (window.appSettings && window.appSettings.tmdbKey) ? window.appSettings.tmdbKey.trim() : (window.TMDB_API_KEY || "eaa427dc2d3150ffec741537c8e0de6d");
            const tmdbId = itemData?.tmdbId || itemData?.id || contentId;

            try {
                const endpoint = type === 'tv' ? `https://api.themoviedb.org/3/tv/${tmdbId}/images?api_key=${tmdbKey}` : `https://api.themoviedb.org/3/movie/${tmdbId}/images?api_key=${tmdbKey}`;
                const res = await fetch(endpoint).then(r => r.json()).catch(() => null);
                if (res && Array.isArray(res.backdrops) && res.backdrops.length > 0) {
                    const tmdbStills = res.backdrops
                        .slice(0, 16)
                        .map(b => `https://image.tmdb.org/t/p/original${b.file_path}`);
                    stills = [...stills, ...tmdbStills];
                }
            } catch(e) {}

            // Deduplicate
            stills = Array.from(new Set(stills));

            // Fallback to backdrop image if no stills found
            if (stills.length === 0 && itemData && itemData.backdrop) {
                stills.push(itemData.backdrop);
            }

            window.currentLightboxImages = stills;

            if (stills.length === 0) {
                const section = document.getElementById('screenshots-section');
                if (section) section.style.display = 'none';
                return;
            }

            if (counter) counter.innerText = `${stills.length} Previews`;

            gallery.innerHTML = stills.map((url, idx) => `
                <div onclick="window.openLightbox(${idx})" class="group cursor-pointer relative aspect-video rounded-xl overflow-hidden bg-neutral-900 border border-white/10 hover:border-red-500 shadow-md transition-all duration-300 transform hover:scale-[1.02]">
                    <img src="${url}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.parentElement.style.display='none'">
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div class="w-10 h-10 rounded-full bg-black/70 border border-white/30 text-white flex items-center justify-center text-sm shadow-xl">
                            <i class="fas fa-search-plus"></i>
                        </div>
                    </div>
                    <div class="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm text-[10px] text-gray-300 px-1.5 py-0.5 rounded border border-white/10">
                        <i class="fas fa-camera text-[8px] mr-0.5"></i> ${idx + 1}
                    </div>
                </div>
            `).join('');
        };

        window.openLightbox = function(index) {
            if (!window.currentLightboxImages || window.currentLightboxImages.length === 0) return;
            window.currentLightboxIndex = index;

            let modal = document.getElementById('screenshot-lightbox-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'screenshot-lightbox-modal';
                modal.className = 'fixed inset-0 z-[120] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none';
                modal.innerHTML = `
                    <div class="absolute top-4 right-4 z-50 flex items-center gap-3">
                        <a id="lightbox-download-btn" href="#" download target="_blank" class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition border border-white/15" title="Open Full Resolution">
                            <i class="fas fa-external-link-alt text-sm"></i>
                        </a>
                        <button onclick="window.closeLightbox()" class="w-10 h-10 rounded-full bg-white/10 hover:bg-red-600 text-white flex items-center justify-center transition border border-white/15 cursor-pointer" title="Close (Esc)">
                            <i class="fas fa-times text-lg"></i>
                        </button>
                    </div>

                    <div class="absolute top-5 left-6 text-sm text-gray-300 font-bold" id="lightbox-counter">1 / 1</div>

                    <!-- Main Image Display -->
                    <div class="relative w-full max-w-6xl max-h-[85vh] flex items-center justify-center">
                        <button onclick="window.stepLightbox(-1)" class="absolute left-2 md:-left-12 z-20 w-11 h-11 rounded-full bg-black/70 hover:bg-netflixRed text-white flex items-center justify-center transition border border-white/20 cursor-pointer shadow-2xl" title="Previous (Left Arrow)">
                            <i class="fas fa-chevron-left"></i>
                        </button>

                        <img id="lightbox-img" src="" class="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl transition-all duration-300">

                        <button onclick="window.stepLightbox(1)" class="absolute right-2 md:-right-12 z-20 w-11 h-11 rounded-full bg-black/70 hover:bg-netflixRed text-white flex items-center justify-center transition border border-white/20 cursor-pointer shadow-2xl" title="Next (Right Arrow)">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                `;
                document.body.appendChild(modal);

                // Keyboard navigation
                window.addEventListener('keydown', (e) => {
                    const m = document.getElementById('screenshot-lightbox-modal');
                    if (!m || m.style.display === 'none') return;
                    if (e.key === 'Escape') window.closeLightbox();
                    else if (e.key === 'ArrowLeft') window.stepLightbox(-1);
                    else if (e.key === 'ArrowRight') window.stepLightbox(1);
                });
            }

            modal.style.display = 'flex';
            window.updateLightboxView();
        };

        window.updateLightboxView = function() {
            const list = window.currentLightboxImages;
            const idx = window.currentLightboxIndex;
            const imgEl = document.getElementById('lightbox-img');
            const counterEl = document.getElementById('lightbox-counter');
            const downloadBtn = document.getElementById('lightbox-download-btn');
            if (!imgEl || !list || list.length === 0) return;

            const curUrl = list[idx];
            imgEl.src = curUrl;
            if (counterEl) counterEl.innerText = `${idx + 1} of ${list.length}`;
            if (downloadBtn) downloadBtn.href = curUrl;
        };

        window.stepLightbox = function(step) {
            const list = window.currentLightboxImages;
            if (!list || list.length <= 1) return;
            window.currentLightboxIndex = (window.currentLightboxIndex + step + list.length) % list.length;
            window.updateLightboxView();
        };

        window.closeLightbox = function() {
            const modal = document.getElementById('screenshot-lightbox-modal');
            if (modal) modal.style.display = 'none';
        };
        """
            html = html[:pos_after_render_details] + lightbox_code + "\n        " + html[pos_after_render_details:]
            print("✓ Injected Lightbox Viewer script")

        # Now make sure loadContentScreenshots is invoked inside renderDetails
        pos_render_details_end = html.find("if (window.renderMoreLikeThis) window.renderMoreLikeThis();")
        if pos_render_details_end != -1:
            replacement_call = """if (window.renderMoreLikeThis) window.renderMoreLikeThis();
            if (window.loadContentScreenshots) window.loadContentScreenshots(id, type, data);"""
            html = html.replace("if (window.renderMoreLikeThis) window.renderMoreLikeThis();", replacement_call, 1)
            print("✓ Called loadContentScreenshots in renderDetails")
        else:
            # check where appContent.innerHTML is set in renderDetails
            pos_details_content = html.find("appContent.innerHTML = `")
            if pos_details_content != -1:
                pos_details_tail = html.find("window.initPlayer(", pos_details_content)
                if pos_details_tail == -1:
                    pos_details_tail = html.find("if (window.finishLoadingProgress)", pos_details_content)
                if pos_details_tail != -1:
                    call_code = "\n            if (window.loadContentScreenshots) window.loadContentScreenshots(id, type, data);\n"
                    html = html[:pos_details_tail] + call_code + html[pos_details_tail:]
                    print("✓ Injected loadContentScreenshots call before details finish")

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Done updating index.html")

update_index()
