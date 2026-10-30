import sys

with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add #global-loading-bar right after <body>
if 'id="global-loading-bar"' not in text:
    body_tag = '<body class="bg-[#141414] text-white font-sans antialiased overflow-x-hidden selection:bg-netflixRed selection:text-white">'
    if body_tag in text:
        bar_html = body_tag + '\n    <div id="global-loading-bar" class="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-red-600 via-netflixRed to-amber-400 z-[99999] transition-all duration-300 pointer-events-none shadow-[0_0_12px_rgba(229,9,20,0.85)] opacity-0 w-0"></div>'
        text = text.replace(body_tag, bar_html, 1)
    else:
        # Fallback
        text = text.replace('<body', '<div id="global-loading-bar" class="fixed top-0 left-0 h-[3px] bg-gradient-to-r from-red-600 via-netflixRed to-amber-400 z-[99999] transition-all duration-300 pointer-events-none shadow-[0_0_12px_rgba(229,9,20,0.85)] opacity-0 w-0"></div>\n<body', 1)

# 2. Add loading progress helper functions and global click feedback
old_loader_anchor = '        window.fetchFirebaseData = fetchFirebaseData;'
assert old_loader_anchor in text, 'fetchFirebaseData anchor not found'

progress_helpers = '''        // Ultra-Fast Top Progress Bar for Instant Click & Routing Feedback
        window.startLoadingProgress = function() {
            const bar = document.getElementById('global-loading-bar');
            if (!bar) return;
            bar.style.transition = 'width 0.2s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.1s ease';
            bar.style.opacity = '1';
            bar.style.width = '45%';
            if (window._loadingBarInterval) clearInterval(window._loadingBarInterval);
            window._loadingBarInterval = setInterval(() => {
                const cur = parseFloat(bar.style.width) || 45;
                if (cur < 85) {
                    bar.style.width = (cur + (85 - cur) * 0.25) + '%';
                }
            }, 120);
        };

        window.finishLoadingProgress = function() {
            const bar = document.getElementById('global-loading-bar');
            if (!bar) return;
            if (window._loadingBarInterval) clearInterval(window._loadingBarInterval);
            bar.style.transition = 'width 0.15s ease-out, opacity 0.25s ease';
            bar.style.width = '100%';
            setTimeout(() => {
                bar.style.opacity = '0';
                setTimeout(() => {
                    bar.style.width = '0%';
                }, 250);
            }, 100);
        };

        // Instant click responsiveness listener
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a[href^="#"], button, .card-hover, [onclick*="location.hash"]');
            if (target) {
                if (window.startLoadingProgress) window.startLoadingProgress();
            }
        }, { passive: true });

        window.fetchFirebaseData = fetchFirebaseData;'''

text = text.replace(old_loader_anchor, progress_helpers, 1)

# 3. Optimize fetchFirebaseData: localStorage SWR with slim TV catalog caching
old_fetch_firebase = """        async function fetchFirebaseData(path, force = false) {
            const now = Date.now();
            // Fast in-memory cache check (120s)
            if(!force && window._firebaseDataCache[path] !== undefined && (now - (window._firebaseDataCacheTime[path] || 0) < 120000)) {
                return window._firebaseDataCache[path];
            }
            // Stale-While-Revalidate from sessionStorage for instant 0ms rendering
            if (!force) {
                try {
                    const sessionItem = sessionStorage.getItem('nex_c_' + path);
                    if (sessionItem) {
                        const parsed = JSON.parse(sessionItem);
                        if (parsed && parsed.d) {
                            window._firebaseDataCache[path] = parsed.d;
                            window._firebaseDataCacheTime[path] = now;
                            // Revalidate in background if older than 45s
                            if (now - parsed.t > 45000) {
                                setTimeout(() => fetchFirebaseData(path, true), 100);
                            }
                            return parsed.d;
                        }
                    }
                } catch(e) {}
            }

            const dbUrl = window.FIREBASE_CONFIG?.databaseURL || window.FB_URL || 'https://nexflix2-3ef14-default-rtdb.asia-southeast1.firebasedatabase.app';
            // High-speed parallel REST fetch
            const fetchRest = async () => {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 2000);
                const res = await fetch(`${dbUrl}/${path}.json`, { signal: ctrl.signal });
                clearTimeout(tid);
                if (res.ok) {
                    return await res.json();
                }
                throw new Error("REST fetch non-ok");
            };
            const fetchSdk = async () => {
                if (!window.dbRef) throw new Error("No dbRef");
                const snapshot = await get(child(window.dbRef, path));
                return snapshot.exists() ? snapshot.val() : null;
            };
            try {
                // Race REST fetch and SDK get - whichever arrives first wins!
                const data = await Promise.race([
                    fetchRest(),
                    fetchSdk()
                ]).catch(() => fetchSdk().catch(() => null));

                if (data !== undefined && data !== null) {
                    window._firebaseDataCache[path] = data;
                    window._firebaseDataCacheTime[path] = now;
                    try {
                        sessionStorage.setItem('nex_c_' + path, JSON.stringify({ t: now, d: data }));
                    } catch(e) {}
                    return data;
                }
            } catch(e) {}
            return window._firebaseDataCache[path] || null;
        }"""

new_fetch_firebase = """        async function fetchFirebaseData(path, force = false) {
            const now = Date.now();
            // Fast in-memory cache check (180s)
            if(!force && window._firebaseDataCache[path] !== undefined && (now - (window._firebaseDataCacheTime[path] || 0) < 180000)) {
                return window._firebaseDataCache[path];
            }

            // Stale-While-Revalidate from localStorage & sessionStorage for INSTANT 0ms rendering
            if (!force) {
                try {
                    let cachedRaw = null;
                    try { cachedRaw = localStorage.getItem('nex_c_' + path); } catch(e){}
                    if (!cachedRaw) {
                        try { cachedRaw = sessionStorage.getItem('nex_c_' + path); } catch(e){}
                    }
                    if (cachedRaw) {
                        const parsed = JSON.parse(cachedRaw);
                        if (parsed && parsed.d) {
                            window._firebaseDataCache[path] = parsed.d;
                            window._firebaseDataCacheTime[path] = now;
                            // Revalidate in background if older than 45s without blocking user!
                            if (now - parsed.t > 45000) {
                                setTimeout(() => fetchFirebaseData(path, true), 150);
                            }
                            return parsed.d;
                        }
                    }
                } catch(e) {}
            }

            const dbUrl = window.FIREBASE_CONFIG?.databaseURL || window.FB_URL || 'https://nexflix2-3ef14-default-rtdb.asia-southeast1.firebasedatabase.app';
            // High-speed parallel REST fetch with adaptive timeout
            const timeoutMs = (path === 'tvShows' || path === 'movies') ? 6000 : 3000;
            const fetchRest = async () => {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), timeoutMs);
                const res = await fetch(`${dbUrl}/${path}.json`, { signal: ctrl.signal });
                clearTimeout(tid);
                if (res.ok) {
                    return await res.json();
                }
                throw new Error("REST fetch non-ok");
            };
            const fetchSdk = async () => {
                if (!window.dbRef) throw new Error("No dbRef");
                const snapshot = await get(child(window.dbRef, path));
                return snapshot.exists() ? snapshot.val() : null;
            };
            try {
                // Race REST fetch and SDK get - whichever arrives first wins!
                const data = await Promise.race([
                    fetchRest(),
                    fetchSdk()
                ]).catch(() => fetchSdk().catch(() => null));

                if (data !== undefined && data !== null) {
                    window._firebaseDataCache[path] = data;
                    window._firebaseDataCacheTime[path] = now;
                    
                    // Persistent storage with slim TV catalog optimization to keep cache under 300KB
                    try {
                        let toStore = data;
                        if (path === 'tvShows' && typeof data === 'object') {
                            toStore = {};
                            for (const [k, v] of Object.entries(data)) {
                                if (!v) continue;
                                const item = { ...v };
                                if (item.seasons) {
                                    item.seasonsCount = Object.keys(item.seasons).length;
                                    delete item.seasons;
                                }
                                toStore[k] = item;
                            }
                        }
                        localStorage.setItem('nex_c_' + path, JSON.stringify({ t: now, d: toStore }));
                    } catch(e) {
                        try { sessionStorage.setItem('nex_c_' + path, JSON.stringify({ t: now, d: data })); } catch(err) {}
                    }
                    return data;
                }
            } catch(e) {}
            return window._firebaseDataCache[path] || null;
        }"""

assert old_fetch_firebase in text, 'old_fetch_firebase not found'
text = text.replace(old_fetch_firebase, new_fetch_firebase, 1)

# 4. In handleRoute, add startLoadingProgress and finishLoadingProgress
old_handle_route_start = """        window.handleRoute = function() {


            // Update active state of bottom nav"""

new_handle_route_start = """        window.handleRoute = function() {
            if (window.startLoadingProgress) window.startLoadingProgress();

            // Update active state of bottom nav"""

assert old_handle_route_start in text, 'old_handle_route_start not found'
text = text.replace(old_handle_route_start, new_handle_route_start, 1)

old_handle_route_end = """            else renderHome();
            
            window.scrollTo(0,0);
        }"""

new_handle_route_end = """            else renderHome();
            
            window.scrollTo(0,0);
            if (window.finishLoadingProgress) window.finishLoadingProgress();
        }"""

assert old_handle_route_end in text, 'old_handle_route_end not found'
text = text.replace(old_handle_route_end, new_handle_route_end, 1)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(text)

print("Part 1-4 applied successfully!")
