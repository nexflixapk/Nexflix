
        
        

        // CONFIGURATION
        const FIREBASE_CONFIG = {
          apiKey: "AIzaSyA8chJ_ZjPotnwnJG5XrYAl-GX9Afs-1nA",
          authDomain: "nexflix2-3ef14.firebaseapp.com",
          databaseURL: "https://nexflix2-3ef14-default-rtdb.asia-southeast1.firebasedatabase.app",
          projectId: "nexflix2-3ef14",
          storageBucket: "nexflix2-3ef14.firebasestorage.app",
          messagingSenderId: "1081064310114",
          appId: "1:1081064310114:web:9bab8fd549fc05cd61983b",
          measurementId: "G-ZGPW1RC4E3"
        };
        const TMDB_API_KEY = "eaa427dc2d3150ffec741537c8e0de6d";

        
        window.savedSearchState = { query: '', scrollY: 0 };
        let db;

        try {
            const app = initializeApp(FIREBASE_CONFIG);
            db = getDatabase(app);
            window.firebaseDb = db;
            window.db = db;
            window.get = get;
            window.ref = ref;
            window.child = child;
            window.push = push;
            window.set = set;
        } catch(e) {
            console.error("Firebase init failed.", e);
        }

        window.dbRef = db ? ref(db) : null;
        function injectAd(containerId, adCode) {
            const container = document.getElementById(containerId);
            if(container) {
                if(adCode && adCode.trim() !== '') {
                    container.innerHTML = adCode;
                    container.classList.remove('hidden');
                    
                    // Evaluate scripts if present
                    const scripts = container.querySelectorAll('script');
                    scripts.forEach(script => {
                        const newScript = document.createElement('script');
                        if (script.src) {
                            newScript.src = script.src;
                            newScript.async = script.async;
                        } else {
                            newScript.textContent = script.textContent;
                        }
                        document.body.appendChild(newScript);
                        // Optional: remove after inject to clean up DOM, but it might break some ad networks
                    });
                } else {
                    container.innerHTML = '';
                    container.classList.add('hidden');
                }
            }
        }

        window.addEventListener('submitRatingEvent', async (e) => {
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
        });
        
        // Prevent iframe ads from redirecting the main app window
        window.addEventListener('beforeunload', function (e) {
            if (window.location.hash.includes('#watch')) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        });
        
        window.TMDB_API_KEY = TMDB_API_KEY;

        const appContent = document.getElementById('app-content');
        
        
        window.addEventListener('scroll', () => {
            if (window.location.hash === '#search') {
                window.savedSearchState.scrollY = window.scrollY;
            }
        });
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash || '#home';
            if (hash !== '#search' && !hash.startsWith('#movie/') && !hash.startsWith('#tv/') && !hash.startsWith('#watch/')) {
                 window.savedSearchState = { query: '', scrollY: 0 };
            }
        });

        window.addEventListener('scroll', () => {
            const nav = document.getElementById('navbar');
            if (window.scrollY > 10) {
                nav.classList.add('navbar-scrolled');
                nav.classList.remove('bg-gradient-to-b', 'from-black/90', 'to-transparent');
            } else {
                nav.classList.remove('navbar-scrolled');
                nav.classList.add('bg-gradient-to-b', 'from-black/90', 'to-transparent');
            }
        });

        window.updateSEO = function(title, desc, image, type = 'website') {
            const siteName = window.appSettings?.siteName || 'NEXFLIX';
            const fullTitle = title ? `${title} - ${siteName}` : (window.appSettings?.seoTitle || siteName);
            document.title = fullTitle;
            
            let metaD = document.querySelector('meta[name="description"]');
            if(!metaD) { metaD = document.createElement('meta'); metaD.name="description"; document.head.appendChild(metaD); }
            metaD.content = desc || window.appSettings?.seoDesc || '';

            let ogTitle = document.querySelector('meta[property="og:title"]');
            if(!ogTitle) { ogTitle = document.createElement('meta'); ogTitle.setAttribute('property', 'og:title'); document.head.appendChild(ogTitle); }
            ogTitle.content = fullTitle;

            let ogDesc = document.querySelector('meta[property="og:description"]');
            if(!ogDesc) { ogDesc = document.createElement('meta'); ogDesc.setAttribute('property', 'og:description'); document.head.appendChild(ogDesc); }
            ogDesc.content = desc || window.appSettings?.seoDesc || '';

            let ogImage = document.querySelector('meta[property="og:image"]');
            if(!ogImage) { ogImage = document.createElement('meta'); ogImage.setAttribute('property', 'og:image'); document.head.appendChild(ogImage); }
            ogImage.content = image || window.appSettings?.headerLogo || '';

            let ld = document.getElementById('json-ld-schema');
            if(!ld) { ld = document.createElement('script'); ld.id = 'json-ld-schema'; ld.type = 'application/ld+json'; document.head.appendChild(ld); }
            
            if (type === 'movie' || type === 'tv') {
                const schema = {
                    "@context": "https://schema.org",
                    "@type": type === 'movie' ? "Movie" : "TVSeries",
                    "name": title,
                    "description": desc,
                    "image": image,
                    "url": window.location.href
                };
                ld.textContent = JSON.stringify(schema);
            } else {
                ld.textContent = '';
            }
        };

        window.injectAd = function(containerId, adCode) {
            const container = document.getElementById(containerId);
            if (!container) return;
            container.innerHTML = '';
            if (!adCode) {
                container.style.display = 'none';
                return;
            }
            container.style.display = 'block';
            try {
                const frag = document.createRange().createContextualFragment(adCode);
                container.appendChild(frag);
                
                // Force script execution for external and inline scripts
                const scripts = container.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                    if (oldScript.parentNode) {
                        oldScript.parentNode.replaceChild(newScript, oldScript);
                    }
                });
            } catch(e) {
                container.innerHTML = adCode; // fallback
            }
        };

        function renderFooter() {
            const footer = document.querySelector('footer');
            if(!footer) return;
            const s = window.appSettings || {};
            const fText = s.footerText || s.siteName || 'NEXFLIX';
            const fCopy = s.footerCopyright || '&copy; 2026 NEXFLIX, Inc.';
            
            let socialHtml = '';
            if(s.socialFb) socialHtml += `<a href="${s.socialFb}" target="_blank"><i class="fab fa-facebook-f hover:text-gray-300 cursor-pointer"></i></a>`;
            if(s.socialIg) socialHtml += `<a href="${s.socialIg}" target="_blank"><i class="fab fa-instagram hover:text-gray-300 cursor-pointer"></i></a>`;
            if(s.socialTw) socialHtml += `<a href="${s.socialTw}" target="_blank"><i class="fab fa-twitter hover:text-gray-300 cursor-pointer"></i></a>`;
            if(s.socialYt) socialHtml += `<a href="${s.socialYt}" target="_blank"><i class="fab fa-youtube hover:text-gray-300 cursor-pointer"></i></a>`;
            if(s.socialTg) socialHtml += `<a href="${s.socialTg}" target="_blank"><i class="fab fa-telegram hover:text-gray-300 cursor-pointer"></i></a>`;

            const footerHtml = `
                <div id="footer-logo-container" class="mb-6">
                    ${s.headerLogo ? `<img src="${s.headerLogo}" class="h-8">` : `<h2 class="text-2xl font-black text-gray-600 tracking-tighter" style="font-family: 'Arial Black', sans-serif;">${fText}</h2>`}
                </div>
                <div class="flex gap-6 text-xl mb-6 text-white">
                    ${socialHtml}
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    ${s.linkAudioDesc ? `<a href="${s.linkAudioDesc}" class="hover:underline">Audio Description</a>` : '<a href="#" class="hover:underline">Audio Description</a>'}
                    ${s.linkHelpCenter ? `<a href="${s.linkHelpCenter}" class="hover:underline">Help Center</a>` : '<a href="#" class="hover:underline">Help Center</a>'}
                    ${s.linkGiftCards ? `<a href="${s.linkGiftCards}" class="hover:underline">Gift Cards</a>` : '<a href="#" class="hover:underline">Gift Cards</a>'}
                    ${s.linkMediaCenter ? `<a href="${s.linkMediaCenter}" class="hover:underline">Media Center</a>` : '<a href="#" class="hover:underline">Media Center</a>'}
                    ${s.linkTermsOfUse ? `<a href="${s.linkTermsOfUse}" class="hover:underline">Terms of Use</a>` : '<a href="#page-termsofuse" class="hover:underline">Terms of Use</a>'}
                    ${s.linkPrivacy ? `<a href="${s.linkPrivacy}" class="hover:underline">Privacy</a>` : '<a href="#page-privacy" class="hover:underline">Privacy</a>'}
                    ${s.linkCorporate ? `<a href="${s.linkCorporate}" class="hover:underline">Corporate Information</a>` : '<a href="#page-corporate" class="hover:underline">Corporate Information</a>'}
                    ${s.linkContactUs ? `<a href="${s.linkContactUs}" class="hover:underline">Contact Us</a>` : '<a href="#page-contactus" class="hover:underline">Contact Us</a>'}
                </div>
                ${s.linkServiceCode ? `<a href="${s.linkServiceCode}"><button class="border border-gray-500 px-3 py-1.5 mb-6 hover:text-white transition text-xs cursor-pointer">Service Code</button></a>` : '<button class="border border-gray-500 px-3 py-1.5 mb-6 hover:text-white transition text-xs cursor-pointer">Service Code</button>'}
                <p class="text-xs">${fCopy}</p>
            `;
            footer.innerHTML = footerHtml;
        }

        async function initApp() {
            // Load Settings
            if (window.dbRef) {
                try {
                    const snap = await get(child(window.dbRef, 'settings'));
                    if (snap.exists()) {
                        const b = snap.val();
                        window.appSettings = b;
                        
                        // Maintenance Mode Check
                        renderFooter();
                        if (b.maintenanceMode) {
                            document.body.innerHTML = `<div class="h-screen w-full bg-[#141414] flex flex-col items-center justify-center text-white p-6 text-center">
                                <i class="fas fa-tools text-6xl text-netflixRed mb-6"></i>
                                <h1 class="text-3xl md:text-5xl font-black mb-4">${b.siteName || 'NEXFLIX'} is undergoing maintenance</h1>
                                <p class="text-gray-400 text-lg">We're updating our servers to bring you better content. Please check back later!</p>
                            </div>`;
                            return;
                        }
                        
                        // Branding
                        if (b.siteName) {
                            const logos = document.querySelectorAll('#header-logo-container');
                            logos.forEach(l => { if(!b.headerLogo) l.innerText = b.siteName; });
                            document.title = b.seoTitle || b.siteName;
                        }
                        if (b.seoTitle) document.title = b.seoTitle;
                        
                        // Meta tags
                        if (b.seoDesc) {
                            let metaD = document.querySelector('meta[name="description"]');
                            if(!metaD) { metaD = document.createElement('meta'); metaD.name="description"; document.head.appendChild(metaD); }
                            metaD.content = b.seoDesc;
                        }
                        if (b.seoKeywords) {
                            let metaK = document.querySelector('meta[name="keywords"]');
                            if(!metaK) { metaK = document.createElement('meta'); metaK.name="keywords"; document.head.appendChild(metaK); }
                            metaK.content = b.seoKeywords;
                        }

                        if (b.favicon) {
                            let link = document.getElementById('dynamic-favicon');
                            if (!link) {
                                link = document.createElement('link');
                                link.id = 'dynamic-favicon';
                                link.rel = 'icon';
                                document.head.appendChild(link);
                            }
                            link.href = b.favicon;
                        }
                        if (b.headerLogo) {
                            document.getElementById('header-logo-container').innerHTML = `<img src="${b.headerLogo}" alt="Logo" class="h-8 md:h-10 object-contain">`;
                            document.getElementById('header-logo-container').classList.remove('text-netflixRed', 'text-3xl', 'md:text-4xl', 'font-extrabold', 'tracking-tighter');
                        }
                        if (b.footerLogo) {
                            const flc = document.getElementById('footer-logo-container');
                            if(flc) flc.innerHTML = `<img src="${b.footerLogo}" alt="Footer Logo" class="h-8 md:h-12 object-contain">`;
                        }
                        
                        // Advertisement
                        if (b.adImg) {
                            document.getElementById('global-ad-container').classList.remove('hidden');
                            document.getElementById('global-ad-img').src = b.adImg;
                            if(b.adLink) document.getElementById('global-ad-link').href = b.adLink;
                        }
                    }
                } catch(e) {}
            }
            handleRoute();
        }

        
        setTimeout(() => {
            const hSearch = document.getElementById('header-search');
            if(hSearch) {
                hSearch.addEventListener('keypress', function(e) {
                    if(e.key === 'Enter') {
                        const val = this.value.trim();
                        if(val) {
                            window.location.hash = '#search';
                            setTimeout(() => {
                                const mainSearch = document.getElementById('search-input');
                                if(mainSearch) {
                                    mainSearch.value = val;
                                    mainSearch.dispatchEvent(new Event('input'));
                                }
                            }, 500);
                        }
                    }
                });
            }
        }, 1000);

        function handleRoute() {
            const hash = window.location.hash || '#home';
            
            // Update navigation active states
            const baseHash = hash.split('/')[0];
            document.querySelectorAll('.nav-link').forEach(link => {
                const href = link.getAttribute('href');
                if (href === baseHash || (baseHash === '' && href === '#home')) {
                    link.classList.add('text-white', 'font-bold');
                    link.classList.remove('text-gray-300', 'text-gray-400', 'font-medium', 'font-semibold');
                    
                    // For mobile icons, give active color
                    const icon = link.querySelector('i');
                    if(icon) icon.classList.add('text-white');
                } else {
                    link.classList.remove('text-white', 'font-bold');
                    const isMobile = link.closest('#mobile-bottom-nav');
                    if (isMobile) {
                        link.classList.add('text-gray-400');
                    } else {
                        link.classList.add('text-gray-300');
                    }
                    
                    const icon = link.querySelector('i');
                    if(icon) icon.classList.remove('text-white');
                }
            });
            
            appContent.innerHTML = `
                <div class="w-full min-h-screen bg-[#111] overflow-hidden">
                    <!-- Hero Skeleton -->
                    <div class="h-[60vh] md:h-[85vh] w-full bg-gray-900 animate-pulse relative">
                        <div class="absolute bottom-10 left-4 md:left-12 flex flex-col gap-3 w-3/4 md:w-1/3">
                            <div class="h-8 md:h-16 bg-gray-800 rounded w-2/3"></div>
                            <div class="h-3 md:h-4 bg-gray-800 rounded w-1/3 mt-2"></div>
                            <div class="h-3 md:h-4 bg-gray-800 rounded w-full mt-2"></div>
                            <div class="h-3 md:h-4 bg-gray-800 rounded w-5/6"></div>
                            <div class="flex gap-4 mt-4">
                                <div class="h-10 w-24 bg-gray-800 rounded"></div>
                                <div class="h-10 w-24 bg-gray-800 rounded hidden md:block"></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Rows Skeleton -->
                    <div class="px-4 md:px-12 -mt-6 md:-mt-20 relative z-20 pb-20">
                        <div class="mb-8">
                            <div class="h-5 md:h-6 w-32 md:w-48 bg-gray-800 rounded mb-4 animate-pulse"></div>
                            <div class="flex gap-2.5 overflow-hidden">
                                ${Array(6).fill('<div class="w-[30vw] md:w-[200px] aspect-[2/3] bg-gray-900 animate-pulse rounded flex-shrink-0"></div>').join('')}
                            </div>
                        </div>
                        <div class="mb-8 hidden sm:block">
                            <div class="h-5 md:h-6 w-40 md:w-56 bg-gray-800 rounded mb-4 animate-pulse"></div>
                            <div class="flex gap-2.5 overflow-hidden">
                                ${Array(6).fill('<div class="w-[30vw] md:w-[200px] aspect-[2/3] bg-gray-900 animate-pulse rounded flex-shrink-0"></div>').join('')}
                            </div>
                        </div>
                    </div>
                </div>`;
            
            if (hash === '#home') renderHome();
            else if (hash === '#movies') renderCategory('movie');
            else if (hash === '#tv') renderCategory('tv');
            else if (hash === '#new') renderCategory('new');
            else if (hash.startsWith('#movie/')) renderDetails(hash.split('/')[1], 'movie');
            else if (hash.startsWith('#tv/')) renderDetails(hash.split('/')[1], 'tv');
            else if (hash.startsWith('#page-')) renderCustomPage(hash.replace('#page-', ''));
            else if (hash.startsWith('#watch/')) {
                const parts = hash.split('/');
                if(parts.length >= 3) renderPlayer(parts[1], parts[2], parts[3], parts[4]);
            }
            else if (hash === '#mylist') renderMyList();
            else if (hash === '#search') renderSearch();
            else if (hash === '#request') renderRequest();
            else if (hash === '#rewards') renderRewards();
            else if (hash === '#profile') renderProfile();
            else renderHome();
            
            window.scrollTo(0,0);
        }

        async function renderCustomPage(slug) {
            try {
                const snap = await get(ref(db, `pages/${slug}`));
                if (snap.exists()) {
                    const pageData = snap.val();
                    updateSEO(pageData.title, null, null, "article");
                    
                    appContent.innerHTML = `
                        <div class="pt-24 pb-16 px-4 md:px-8 max-w-4xl mx-auto min-h-screen">
                            <h1 class="text-3xl md:text-5xl font-bold mb-8 text-white">${pageData.title}</h1>
                            <div class="prose prose-invert max-w-none text-gray-300">
                                ${pageData.content}
                            </div>
                        </div>
                    `;
                } else {
                    appContent.innerHTML = `
                        <div class="pt-24 pb-16 px-4 flex flex-col items-center justify-center min-h-[60vh]">
                            <h1 class="text-4xl font-bold text-gray-500 mb-4">404</h1>
                            <p class="text-xl text-gray-400">Page not found</p>
                            <a href="#home" class="mt-6 text-netflixRed hover:underline">Go back home</a>
                        </div>
                    `;
                }
            } catch(e) {
                console.error(e);
            }
        }
        
        function saveContinueWatching(id, type) {
            let cwList = [];
            try { cwList = JSON.parse(localStorage.getItem('nexora_cw') || '[]'); } catch(e){}
            cwList = cwList.filter(i => !(i.id === id && i.type === type));
            cwList.unshift({ id, type, timestamp: Date.now() });
            cwList = cwList.slice(0, 10);
            localStorage.setItem('nexora_cw', JSON.stringify(cwList));
        }

        window.addEventListener('hashchange', handleRoute);

        window.navToSection = function(id, event) {
            if(event) event.preventDefault();
            const mobileMenu = document.getElementById('mobile-menu');
            if(mobileMenu) mobileMenu.classList.add('hidden');
            
            // For mobile bottom nav to specific routes (e.g., #movies) that don't map to IDs
            if (id === 'section-movies' || id === 'section-tv-shows' || id === 'section-coming-soon') {
                if(id === 'section-movies') window.location.hash = '#movies';
                if(id === 'section-tv-shows') window.location.hash = '#tv';
                if(id === 'section-coming-soon') window.location.hash = '#new';
                return;
            }

            const hash = window.location.hash;
            if (hash === '' || hash === '#home') {
                const el = document.getElementById(id);
                if (el) {
                    const y = el.getBoundingClientRect().top + window.scrollY - 80;
                    window.scrollTo({top: y, behavior: 'smooth'});
                }
            } else {
                window.location.hash = '#home';
                let attempts = 0;
                const checkExist = setInterval(() => {
                    const el = document.getElementById(id);
                    if (el) {
                        clearInterval(checkExist);
                        const y = el.getBoundingClientRect().top + window.scrollY - 80;
                        window.scrollTo({top: y, behavior: 'smooth'});
                    }
                    attempts++;
                    if(attempts > 20) clearInterval(checkExist); // stop after 2s
                }, 100);
            }
        }

        async function fetchFirebaseData(path) {
            if(!window.dbRef) return null;
            try {
                const snapshot = await get(child(window.dbRef, path));
                return snapshot.exists() ? snapshot.val() : null;
            } catch (e) {
                console.error("Firebase read error", e);
                return null;
            }
        }

        // ==========================
        // HOME PAGE (Matches Images 1-10)
        // ==========================
        async function renderCategory(categoryType) {
            
            const movies = await fetchFirebaseData('movies') || {};
            const tvShows = await fetchFirebaseData('tvShows') || {};
            
            // Inject keys as id property
            Object.keys(movies).forEach(k => { if(movies[k]) movies[k].id = movies[k].id || k; movies[k].type = 'movie'; });
            Object.keys(tvShows).forEach(k => { if(tvShows[k]) tvShows[k].id = tvShows[k].id || k; tvShows[k].type = 'tv'; });

            let items = [];
            let title = '';

            if (categoryType === 'movie') {
                title = 'Movies';
                items = Object.values(movies).filter(m => m && m.status !== 'draft').map(m => ({...m, type: 'movie'}));
            } else if (categoryType === 'tv') {
                title = 'TV Shows';
                items = Object.values(tvShows).filter(m => m && m.status !== 'draft').map(m => ({...m, type: 'tv'}));
            } else if (categoryType === 'new') {
                title = 'Coming Soon & Popular';
                const m = Object.values(movies).filter(m => m && m.status === 'coming_soon').map(m => ({...m, type: 'movie'}));
                const t = Object.values(tvShows).filter(t => t && t.status === 'coming_soon').map(t => ({...t, type: 'tv'}));
                items = [...m, ...t];
            }

            // Extract unique genres and languages
            let genres = new Set();
            let languages = new Set();
            items.forEach(item => {
                if (item.collections && Array.isArray(item.collections)) {
                    item.collections.forEach(c => genres.add(c));
                }
                if (item.genres && Array.isArray(item.genres)) {
                    item.genres.forEach(c => genres.add(c));
                }
                if (item.audioLang && Array.isArray(item.audioLang)) {
                    item.audioLang.forEach(l => languages.add(l));
                }
            });
            genres = Array.from(genres).sort();
            languages = Array.from(languages).sort();
            
            // Store items on window for filtering
            window.currentCategoryItems = items;
            
            let filtersHtml = '<div class="flex flex-wrap items-center gap-4">';
            if (genres.length > 0) {
                filtersHtml += `
                    <div class="flex items-center gap-2">
                        <span class="text-gray-400 text-sm font-bold uppercase tracking-wider flex items-center"><i class="fas fa-filter mr-1"></i> Genre</span>
                        <select id="filter-genre" onchange="applyFilters()" class="bg-[#222] border border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-netflixRed focus:border-netflixRed block p-2 outline-none font-bold shadow-lg min-w-[140px]">
                            <option value="All">All Genres</option>
                            ${genres.map(g => `<option value="${g.replace(/"/g, '&quot;')}">${g}</option>`).join('')}
                        </select>
                    </div>
                `;
            }
            if (languages.length > 0) {
                filtersHtml += `
                    <div class="flex items-center gap-2">
                        <span class="text-gray-400 text-sm font-bold uppercase tracking-wider flex items-center"><i class="fas fa-language mr-1"></i> Audio</span>
                        <select id="filter-lang" onchange="applyFilters()" class="bg-[#222] border border-gray-700 text-gray-300 text-sm rounded-lg focus:ring-netflixRed focus:border-netflixRed block p-2 outline-none font-bold shadow-lg min-w-[140px]">
                            <option value="All">All Languages</option>
                            ${languages.map(l => `<option value="${l.replace(/"/g, '&quot;')}">${l}</option>`).join('')}
                        </select>
                    </div>
                `;
            }
            filtersHtml += '</div>';

            let html = `
                <div class="pt-24 md:pt-32 px-4 md:px-12 min-h-screen max-w-7xl mx-auto">
                    <!-- Top Category Ad -->
                    <div id="category-top-ad" class="w-full text-center empty:hidden mb-6 flex justify-center"></div>
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-10 gap-6">
                        <h1 class="text-4xl font-bold border-l-4 border-netflixRed pl-4">${title}</h1>
                        ${filtersHtml}
                    </div>
                    <div id="category-grid"></div>
                    <!-- Bottom Category Ad -->
                    <div id="category-bottom-ad" class="w-full text-center empty:hidden mt-12 mb-6 flex justify-center"></div>
                </div>
            `;
            appContent.innerHTML = html;

            updateSEO(title, null, null, "website");
            injectAd("header-ad-container", window.appSettings?.adHeader);
            injectAd("category-top-ad", window.appSettings?.adCategoryTop);
            injectAd("category-bottom-ad", window.appSettings?.adCategoryBottom);
            window.applyFilters();
        }

        window.applyFilters = function() {
            const grid = document.getElementById('category-grid');
            if(!grid) return;
            
            const genreEl = document.getElementById('filter-genre');
            const langEl = document.getElementById('filter-lang');
            const genre = genreEl ? genreEl.value : 'All';
            const lang = langEl ? langEl.value : 'All';
            
            grid.style.transition = 'opacity 0.2s ease-out';
            grid.style.opacity = '0';
            
            setTimeout(() => {
                grid.innerHTML = window.getGridSkeletonHtml();
                grid.style.opacity = '1';
                
                setTimeout(() => {
                    const items = window.currentCategoryItems || [];
                    const filtered = items.filter(item => {
                        let genreMatch = genre === 'All' ? true : (
                            (item.collections && item.collections.includes(genre)) ||
                            (item.genres && item.genres.includes(genre))
                        );
                        let langMatch = lang === 'All' ? true : (
                            item.audioLang && item.audioLang.includes(lang)
                        );
                        return genreMatch && langMatch;
                    });
                    
                    if (filtered.length > 0) {
                        let html = `<div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">`;
                        filtered.forEach(item => {
                        html += `
                            <a href="#${item.type}/${item.id}" class="relative rounded-xl overflow-hidden card-hover transition-all duration-300 aspect-[2/3] bg-white/5 backdrop-blur-md border border-white/10 block shadow-[0_8px_32px_rgba(0,0,0,0.15)] group">
                        ${item.type === 'movie' ? '<div class="n-badge"></div>' : ''}
                        <div class="n-badge z-30"></div>
                        <img src="${item.poster || 'https://via.placeholder.com/300x450?text=No+Image'}" loading="lazy" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity">
                        <div class="preview-video-wrapper absolute inset-0 z-10 hidden transition-opacity duration-300 bg-black pointer-events-none rounded-xl overflow-hidden"></div>
                        
                        <!-- Tags Container (Bottom Left & Right) -->
                        <div class="absolute bottom-2 left-2 flex flex-col gap-1 z-10 transition-transform duration-300 group-hover:-translate-y-12">
                            ${item.hd ? `<span class="bg-black/60 backdrop-blur-md border border-white/20 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">${item.hd === true ? 'HD' : item.hd}</span>` : ''}
                            ${item.audioLang && item.audioLang.length > 0 ? `<span class="bg-netflixRed/80 backdrop-blur-md border border-white/20 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm line-clamp-1 max-w-[60px]"><i class="fas fa-microphone-alt mr-1"></i>${item.audioLang[0]}</span>` : ''}
                        </div>
                        <div class="absolute bottom-2 right-2 flex flex-col items-end gap-1 z-10 transition-transform duration-300 group-hover:-translate-y-12">
                            ${item.new ? '<div class="bg-netflixRed/90 backdrop-blur-md text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg tracking-wider border border-white/20 animate-pulse">NEW</div>' : ''}
                            ${item.rating ? `<div class="bg-[#f5c518]/90 backdrop-blur-md text-black text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center border border-white/20"><i class="fas fa-star text-[8px] mr-1"></i>${item.rating}</div>` : ''}
                        </div>
                        
                        <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 z-10">
                            <h3 class="font-bold text-sm md:text-base line-clamp-1 drop-shadow-lg text-white">${item.title || 'Untitled'}</h3>
                            <div class="flex items-center flex-wrap gap-1.5 text-[9px] md:text-[11px] text-gray-300 mt-1.5">
                                ${item.genres && item.genres[0] ? `<span class="text-netflixRed font-semibold">${item.genres[0]}</span><span class="text-gray-500">•</span>` : ''}
                                <span class="border border-white/30 bg-black/40 backdrop-blur-sm px-1.5 rounded">${item.ageRating||'PG-13'}</span>
                                <span class="font-medium">${item.year||''}</span>
                            </div>
                        </div>
                    </a>`;
                        });
                        html += `</div>`;
                        grid.innerHTML = html;
                    } else {
                        grid.innerHTML = `<div class="text-gray-500 py-20 text-center text-xl bg-[#111] rounded-lg border border-gray-800">No content found in this category.</div>`;
                    }
                    
                    // Trigger fade-in
                    requestAnimationFrame(() => {
                        grid.style.opacity = '1';
                    });
                }, 150);
            }, 100);
        }

        
        window.switchMoreLikeThis = function(type, btn) {
            document.querySelectorAll('.mlt-btn').forEach(b => {
                b.classList.remove('text-white', 'border-netflixRed');
                b.classList.add('text-gray-500', 'border-transparent');
            });
            btn.classList.add('text-white', 'border-netflixRed');
            btn.classList.remove('text-gray-500', 'border-transparent');
            
            const container = document.getElementById('mlt-grid-container');
            if(!container) return;
            
            container.style.opacity = '0';
            setTimeout(() => {
                let items = [];
                if (type === 'genre') items = window.cachedGenreItems;
                else if (type === 'cast') items = window.cachedCastItems;
                else if (type === 'all') {
                    // Combine and remove duplicates
                    const combined = [...(window.cachedGenreItems || []), ...(window.cachedCastItems || [])];
                    const map = new Map();
                    combined.forEach(item => map.set(item.id, item));
                    items = Array.from(map.values());
                }
                container.innerHTML = window.generateItemsGridHtml(items);
                container.style.opacity = '1';
            }, 200);
        };
        
        window.getGridSkeletonHtml = function() {
            let html = '<div class="px-4 md:px-12 transition-opacity duration-300"><div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">';
            for(let i=0; i<12; i++) {
                html += `
                    <div class="relative rounded-xl overflow-hidden aspect-[2/3] bg-white/5 backdrop-blur-md animate-pulse border border-white/5 block shadow-[0_8px_32px_rgba(0,0,0,0.15)]">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                        <div class="absolute bottom-2 left-2 w-10 h-4 bg-white/10 rounded"></div>
                        <div class="absolute bottom-2 right-2 w-14 h-4 bg-white/10 rounded"></div>
                    </div>
                `;
            }
            html += '</div></div>';
            return html;
        };

        window.generateItemsGridHtml = function(items) {
            if(!items || items.length === 0) return '<div class="text-gray-500 py-10 text-center px-4 md:px-12">No matching content found.</div>';
            
            let html = '<div class="px-4 md:px-12 transition-opacity duration-300"><div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">';
            items.forEach(item => {
                html += `
                    <a href="#${item.type}/${item.id}" class="relative rounded-xl overflow-hidden card-hover transition-all duration-300 aspect-[2/3] bg-white/5 backdrop-blur-md border border-white/10 block shadow-[0_8px_32px_rgba(0,0,0,0.15)] group">
                        ${item.type === 'movie' ? '<div class="n-badge"></div>' : ''}
                        <div class="n-badge z-30"></div>
                        <img src="${item.poster || 'https://via.placeholder.com/300x450?text=No+Image'}" loading="lazy" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity">
                        <div class="preview-video-wrapper absolute inset-0 z-10 hidden transition-opacity duration-300 bg-black pointer-events-none rounded-xl overflow-hidden"></div>
                        
                        <!-- Tags Container (Bottom Left & Right) -->
                        <div class="absolute bottom-2 left-2 flex flex-col gap-1 z-10 transition-transform duration-300 group-hover:-translate-y-12">
                            ${item.hd ? `<span class="bg-black/60 backdrop-blur-md border border-white/20 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">${item.hd === true ? 'HD' : item.hd}</span>` : ''}
                            ${item.audioLang && item.audioLang.length > 0 ? `<span class="bg-netflixRed/80 backdrop-blur-md border border-white/20 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm line-clamp-1 max-w-[60px]"><i class="fas fa-microphone-alt mr-1"></i>${item.audioLang[0]}</span>` : ''}
                        </div>
                        <div class="absolute bottom-2 right-2 flex flex-col items-end gap-1 z-10 transition-transform duration-300 group-hover:-translate-y-12">
                            ${item.new ? '<div class="bg-netflixRed/90 backdrop-blur-md text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg tracking-wider border border-white/20 animate-pulse">NEW</div>' : ''}
                            ${item.rating ? `<div class="bg-[#f5c518]/90 backdrop-blur-md text-black text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center border border-white/20"><i class="fas fa-star text-[8px] mr-1"></i>${item.rating}</div>` : ''}
                        </div>
                        
                        <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 z-10">
                            <h3 class="font-bold text-sm md:text-base line-clamp-1 drop-shadow-lg text-white">${item.title || 'Untitled'}</h3>
                            <div class="flex items-center flex-wrap gap-1.5 text-[9px] md:text-[11px] text-gray-300 mt-1.5">
                                ${item.genres && item.genres[0] ? `<span class="text-netflixRed font-semibold">${item.genres[0]}</span><span class="text-gray-500">•</span>` : ''}
                                <span class="border border-white/30 bg-black/40 backdrop-blur-sm px-1.5 rounded">${item.ageRating||'PG-13'}</span>
                                <span class="font-medium">${item.year||''}</span>
                            </div>
                        </div>
                    </a>`;
            });
            html += '</div></div>';
            return html;
        };

        async function renderHome() {
            const rawMovies = await fetchFirebaseData('movies') || {};
            const rawTvShows = await fetchFirebaseData('tvShows') || {};
            
            // Helper to sort by year descending
            const sortByYear = (a, b) => {
                const yearA = parseInt(a.year) || 0;
                const yearB = parseInt(b.year) || 0;
                if (yearB !== yearA) return yearB - yearA;
                return (b.createdAt || 0) - (a.createdAt || 0);
            };

            const movies = {};
            Object.keys(rawMovies).forEach(k => {
                if(rawMovies[k]) rawMovies[k].id = k;
            });
            Object.values(rawMovies).filter(m => m && m.status !== 'draft').sort(sortByYear).forEach(m => movies[m.id] = m);

            const tvShows = {};
            Object.keys(rawTvShows).forEach(k => {
                if(rawTvShows[k]) rawTvShows[k].id = k;
            });
            Object.values(rawTvShows).filter(m => m && m.status !== 'draft').sort(sortByYear).forEach(m => tvShows[m.id] = m);
            
            let html = '';
            
            // Hero (Image 1 style)
            let featuredMovies = Object.values(movies).filter(m => m && m.featured);
            let hero = null;
            if (featuredMovies.length > 0) {
                hero = featuredMovies[Math.floor(Math.random() * featuredMovies.length)];
            } else if (Object.values(movies).length > 0) {
                // Fallback to a random movie if no featured movies exist
                const allMovies = Object.values(movies).filter(m=>m);
                hero = allMovies[Math.floor(Math.random() * allMovies.length)];
            } else if (Object.values(tvShows).length > 0) {
                // Fallback to a random tv show
                const allShows = Object.values(tvShows).filter(m=>m);
                hero = allShows[Math.floor(Math.random() * allShows.length)];
            }

            if (hero) {
                html += `
                    <div id="home-hero" class="relative h-[85vh] md:h-[95vh] w-full bg-black flex-shrink-0">
                        <div class="absolute inset-0 bg-cover bg-center opacity-80" style="background-image: url('${hero.backdrop || hero.poster || ''}'); background-position: top center;"></div>
                        <div class="absolute inset-0 hero-gradient z-10"></div>
                        
                        <div class="relative z-20 h-full flex flex-col justify-end items-center md:items-start text-center md:text-left px-4 md:px-12 pb-24 md:pb-32 w-full md:w-2/3 lg:w-1/2 animate-fade-in-up mx-auto md:mx-0">
                            <div class="flex items-center justify-center md:justify-start space-x-2 mb-3 md:mb-4">
                                <span class="bg-netflixRed text-[10px] md:text-xs font-black px-1.5 py-0.5 rounded tracking-widest text-white shadow-lg">N <span class="font-normal opacity-80">FILM</span></span>
                            </div>
                            <h1 class="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-3 md:mb-4 leading-tight tracking-tighter drop-shadow-2xl" style="text-shadow: 2px 2px 10px rgba(0,0,0,0.8);">${hero.title || hero.name || 'Unknown'}</h1>
                            
                            <div class="flex items-center justify-center md:justify-start space-x-3 md:space-x-4 mb-4 md:mb-6 text-[11px] sm:text-xs md:text-sm font-semibold drop-shadow-lg text-gray-300">
                                <span class="text-green-500 font-bold">98% Match</span>
                                <span>${hero.year || '2026'}</span>
                                <span class="border border-gray-600 px-1.5 py-0.5 rounded-sm bg-black/80">${hero.ageRating || 'PG-13'}</span>
                                <span>${hero.title ? 'Movie' : 'TV Show'}</span>
                                <span class="border border-gray-600 px-1.5 py-0.5 rounded-sm bg-black/80 hidden sm:inline-block">${hero.hd ? 'HD' : 'HD'}</span>
                            </div>
                            
                            <p class="text-gray-200 text-sm md:text-lg mb-6 md:mb-8 line-clamp-3 md:line-clamp-4 leading-relaxed drop-shadow-xl max-w-2xl text-shadow-sm hidden sm:block">${hero.overview || 'Experience the greatest entertainment available right now. Dive into this amazing content.'}</p>
                            
                            <!-- Mobile Buttons (My List, Play, Info) -->
                            <div class="flex md:hidden items-center justify-center w-full gap-6 px-4">
                                <button onclick="toggleMyList('${hero.id}', '${hero.title ? 'movie' : 'tv'}')" class="flex flex-col items-center gap-1 text-white hover:text-gray-300 transition-colors">
                                    <i class="fas fa-plus text-xl mb-1"></i>
                                    <span class="text-[10px] font-semibold">My List</span>
                                </button>
                                <a href="#watch/${hero.title ? 'movie' : 'tv'}/${hero.id}" class="bg-white text-black px-8 py-2 rounded-md flex items-center justify-center gap-2 font-bold hover:bg-white/80 transition-colors text-base shadow-sm">
                                    <i class="fas fa-play text-lg"></i> <span>Play</span>
                                </a>
                                <a href="#${hero.type || (hero.title ? "movie" : "tv")}/${hero.id || hero.key}" class="flex flex-col items-center gap-1 text-white hover:text-gray-300 transition-colors">
                                    <i class="fas fa-info-circle text-xl mb-1"></i>
                                    <span class="text-[10px] font-semibold">Info</span>
                                </a>
                            </div>

                            <!-- Desktop Buttons -->
                            <div class="hidden md:flex items-center flex-wrap gap-3 md:gap-4">
                                <a href="#watch/${hero.title ? 'movie' : 'tv'}/${hero.id}" class="bg-white text-black px-6 md:px-8 py-2 md:py-2.5 rounded flex items-center gap-2 font-bold hover:bg-white/80 transition text-base md:text-lg shadow-sm hover:scale-105 active:scale-95 duration-200">
                                    <i class="fas fa-play text-xl"></i> <span>Play</span>
                                </a>
                                <button onclick="openTrailerModal('${hero.title || hero.name}', '${hero.title ? 'movie' : 'tv'}', '${hero.year || ''}')" class="bg-[#6d6d6e]/70 backdrop-blur-md text-white px-6 md:px-8 py-2 md:py-2.5 rounded flex items-center gap-2 font-bold hover:bg-[#6d6d6e]/50 transition text-base md:text-lg shadow-sm hover:scale-105 active:scale-95 duration-200 ring-1 ring-white/20">
                                    <i class="fas fa-film text-xl text-netflixRed"></i> <span>Watch Trailer</span>
                                </button>
                                <a href="#${hero.type || (hero.title ? "movie" : "tv")}/${hero.id || hero.key}" class="bg-[#6d6d6e]/70 backdrop-blur-md text-white px-6 md:px-8 py-2 md:py-2.5 rounded flex items-center gap-2 font-bold hover:bg-[#6d6d6e]/50 transition text-base md:text-lg shadow-sm hover:scale-105 active:scale-95 duration-200 ring-1 ring-white/20">
                                    <i class="fas fa-info-circle text-xl"></i> <span>More Info</span>
                                </a>
                            </div>
                        </div>
                        
                        <div class="absolute right-0 bottom-[20%] z-20 hidden md:flex items-center gap-4 bg-black/20 backdrop-blur-md border-l-4 border-gray-300 pl-4 py-2 pr-12 text-lg font-bold">
                            <i class="fas fa-volume-mute text-white cursor-pointer hover:text-gray-300 border border-white rounded-full p-2"></i>
                            <span class="text-white">${hero.ageRating || 'PG-13'}</span>
                        </div>
                    </div>
                `;
            } else {
                // Ultimate fallback if absolutely empty database
                html += `
                    <div class="relative h-[85vh] md:h-[95vh] w-full bg-black flex-shrink-0">
                        <div class="absolute inset-0 bg-cover bg-center opacity-80" style="background-image: url('https://assets.nflxext.com/ffe/siteui/vlv3/9d3533b2-0e2b-40b2-95e0-eca7979c7896/43987083-0136-4767-bb8f-8b277b0d91d6/US-en-20231015-popsignuptwoweeks-perspective_alpha_website_large.jpg'); background-position: top center;"></div>
                        <div class="absolute inset-0 hero-gradient z-10"></div>
                        <div class="relative z-20 h-full flex flex-col justify-center items-center text-center px-6 md:px-12 w-full">
                            <h1 class="text-4xl md:text-6xl font-black mb-4">Welcome to NEXFLIX</h1>
                            <p class="text-xl text-gray-300">Please add some movies or TV shows from the Admin Panel to feature them here.</p>
                        </div>
                    </div>
                `;
            }

            // --- Home Screen Genres Pill Menu ---
            const collectionsMap = {};
            [...Object.values(movies).map(m=>({...m, type:'movie'})), ...Object.values(tvShows).map(m=>({...m, type:'tv'}))].forEach(m => {
                if (m && m.status !== 'draft') {
                    let itemGenres = new Set();
                    if (m.collections && Array.isArray(m.collections)) m.collections.forEach(c => itemGenres.add(c));
                    if (m.genres && Array.isArray(m.genres)) m.genres.forEach(c => itemGenres.add(c));
                    
                    itemGenres.forEach(c => {
                        if(!collectionsMap[c]) collectionsMap[c] = [];
                        collectionsMap[c].push(m);
                    });
                }
            });
            const customCollections = Object.keys(collectionsMap)
                .sort((a,b) => collectionsMap[b].length - collectionsMap[a].length)
                .slice(0, 5); // Limit to top 5 categories to keep it clean and professional
            
            if(customCollections.length > 0) {
                html += `
                    <div class="px-4 md:px-12 mt-4 md:-mt-10 relative z-30 pb-6 w-full overflow-hidden">
                        <div class="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2 pt-2 scroll-smooth">
                            <span class="text-gray-300 text-xs md:text-sm font-bold uppercase tracking-wider flex items-center shrink-0 mr-1"><i class="fas fa-filter mr-2"></i> Genres:</span>
                            ${customCollections.map(g => `
                                <button onclick="document.getElementById('row-${g.replace(/[^a-zA-Z0-9]/g, '-')}').scrollIntoView({behavior: 'smooth', block: 'center'})" 
                                        class="shrink-0 bg-neutral-900/80 hover:bg-white hover:text-black border border-gray-700/50 text-gray-300 px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-bold tracking-wide transition-all duration-300 shadow-md">
                                    ${g}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
            // ------------------------------------

            html += `<div id="home-ad-1" class="w-full text-center empty:hidden mt-2 mb-6 flex justify-center"></div>`;
            // 1. Trending Now
            const trending = [...Object.values(movies).filter(m=>m && m.trending && m.status !== 'draft').map(m=>({...m, type:'movie'})), ...Object.values(tvShows).filter(m=>m && m.trending && m.status !== 'draft').map(m=>({...m, type:'tv'}))].sort((a,b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));
            if(trending.length > 0) html += generateRow('Trending Now', trending, 'section-trending');

            const allContentGlob = [
                ...Object.values(movies).filter(m=>m && m.status !== 'draft').map(m=>({...m, type:'movie'})), 
                ...Object.values(tvShows).filter(m=>m && m.status !== 'draft').map(m=>({...m, type:'tv'}))
            ];

            // 2. Top 10 Movies
            const top10M = Object.values(movies).filter(m => m && m.top10Rank && m.status !== 'draft').sort((a,b)=>a.top10Rank - b.top10Rank).slice(0,10);
            if(top10M.length > 0) html += generateTop10Row('Top 10 Movies in NEXFLIX Today', top10M, 'movie');

            // 3. Top 10 Series (Image 3/4 Style)
            const top10S = Object.values(tvShows).filter(m => m && m.top10Rank && m.status !== 'draft').sort((a,b)=>a.top10Rank - b.top10Rank).slice(0,10);
            if(top10S.length > 0) html += generateTop10Row('Top 10 Series in NEXFLIX Today', top10S, 'tv');

            html += `<div id="home-ad-2" class="w-full text-center empty:hidden my-8 flex justify-center"></div>`;

            // 4. Coming Soon - This Month & Next
            const newR = [...Object.values(movies).filter(m=>m && m.status === 'coming_soon').map(m=>({...m, type:'movie'})), ...Object.values(tvShows).filter(m=>m && m.status === 'coming_soon').map(m=>({...m, type:'tv'}))].sort((a,b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));
            if(newR.length > 0) html += generateRow('Coming Soon - This Month & Next', newR, 'section-coming-soon', '#new');
            
            // 5. Movies
            const allMoviesOnly = Object.values(movies).filter(m=>m && m.status !== 'draft').map(m=>({...m, type:'movie'})).sort((a,b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));
            if(allMoviesOnly.length > 0) html += generateRow('Movies', allMoviesOnly, 'section-movies', '#movies');

            // 6. TV Shows
            const allTvShows = Object.values(tvShows).filter(m=>m && m.status !== 'draft').map(m=>({...m, type:'tv'})).sort((a,b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));
            if(allTvShows.length > 0) html += generateRow('TV Shows', allTvShows, 'section-tv-shows', '#tv');

            
            // Indian Hit Cinemas
            const indianHits = allContentGlob.filter(m => 
                m.type === 'movie' && (
                    (m.audioLang && m.audioLang.some(l => ['hindi', 'tamil', 'telugu', 'malayalam', 'kannada', 'indian'].some(k => l.toLowerCase().includes(k)))) ||
                    (m.genres && m.genres.some(g => ['hindi', 'tamil', 'telugu', 'malayalam', 'kannada', 'indian', 'bollywood', 'tollywood'].some(k => g.toLowerCase().includes(k)))) ||
                    (m.collections && m.collections.some(g => ['hindi', 'tamil', 'telugu', 'malayalam', 'kannada', 'indian', 'bollywood', 'tollywood'].some(k => g.toLowerCase().includes(k))))
                )
            ).sort((a,b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));
            if(indianHits.length > 0) html += generateRow('Indian Hit Cinemas', indianHits, 'section-indian-hits');

            // Bengali Hit Movies & TV Shows
            const bengaliHits = allContentGlob.filter(m => 
                (m.audioLang && m.audioLang.some(l => l.toLowerCase().includes('bengali') || l.toLowerCase().includes('bangla'))) ||
                (m.genres && m.genres.some(g => g.toLowerCase().includes('bengali') || g.toLowerCase().includes('bangla'))) ||
                (m.collections && m.collections.some(g => g.toLowerCase().includes('bengali') || g.toLowerCase().includes('bangla')))
            );
            bengaliHits.sort((a,b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));
            if(bengaliHits.length > 0) html += generateRow('Bengali Hit Movies & TV Shows', bengaliHits, 'section-bengali-hits');

            // Horror Movies
            const horrorMovies = allContentGlob.filter(m => 
                (m.genres && m.genres.some(g => g.toLowerCase().includes('horror'))) ||
                (m.collections && m.collections.some(g => g.toLowerCase().includes('horror')))
            );
            if(horrorMovies.length > 0) html += generateRow('Horror Movies', horrorMovies, 'section-horror');

            
            // Continue Watching
            let cw = []; try { cw = JSON.parse(localStorage.getItem('nexora_continue_watching') || '[]'); } catch(e) {}
            if (cw.length > 0) html += generateRow('Continue Watching', cw.map(c => ({...c, isCw: true})));

            // Recommended for You (Based on My List genres)
            let mylist = []; try { mylist = JSON.parse(localStorage.getItem('nexora_mylist') || '[]'); } catch(e) {}
            if (mylist.length > 0) {
                let myGenres = new Set();
                mylist.forEach(item => {
                    const fullItem = item.type === 'movie' ? movies[item.id] : tvShows[item.id];
                    if (fullItem && fullItem.collections && Array.isArray(fullItem.collections)) {
                        fullItem.collections.forEach(c => myGenres.add(c));
                    }
                });
                if (myGenres.size > 0) {
                    const mylistIds = mylist.map(i => i.id);
                    const allContent = [...Object.values(movies).filter(m=>m && m.status !== 'draft').map(m=>({...m, type:'movie'})), ...Object.values(tvShows).filter(m=>m && m.status !== 'draft').map(m=>({...m, type:'tv'}))];
                    const recommended = allContent.filter(item => {
                        if (mylistIds.includes(item.id)) return false;
                        if (!item.collections) return false;
                        return item.collections.some(c => myGenres.has(c));
                    }).slice(0, 15);
                    if (recommended.length > 0) html += generateRow('Recommended for You', recommended, 'section-recommended');
                }
            }


            
            // Custom Collections (Generated below)
            customCollections.forEach(colName => {
                html += generateRow(colName, collectionsMap[colName], 'row-' + colName.replace(/[^a-zA-Z0-9]/g, '-'));
            });

            // Categories Banner (Image 10)
            html += `
                <div class="mt-16 px-4 md:px-12">
                    <h2 class="text-xl md:text-2xl font-bold mb-2">Browse More Categories</h2>
                    <p class="text-gray-400 mb-6 text-sm">Explore our catalog by genre, trending content, and more</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div onclick="goToCategory('Action')" class="bg-gradient-to-br from-orange-600 to-red-600 p-6 rounded-lg cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h3 class="text-2xl font-bold mb-2 relative z-10">Action Movies</h3>
                            <p class="text-sm text-white/80 relative z-10">High-octane action films — superheroes, chase scenes.</p>
                        </div>
                        <div onclick="goToCategory('Science Fiction')" class="bg-gradient-to-br from-blue-600 to-purple-600 p-6 rounded-lg cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h3 class="text-2xl font-bold mb-2 relative z-10">Sci-Fi & Fantasy</h3>
                            <p class="text-sm text-white/80 relative z-10">Explore highest-rated titles — acclaimed films.</p>
                        </div>
                        <div onclick="goToCategory('Comedy')" class="bg-gradient-to-br from-green-600 to-teal-600 p-6 rounded-lg cursor-pointer hover:scale-[1.02] hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
                            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <h3 class="text-2xl font-bold mb-2 relative z-10">Comedy Movies</h3>
                            <p class="text-sm text-white/80 relative z-10">Laugh out loud with our comedy collection.</p>
                        </div>
                    </div>
                </div>
                
                <div id="home-ad-3" class="w-full text-center empty:hidden my-12 flex justify-center"></div>
                <div id="tmdb-featured-collections" class="mt-8 mb-16"></div>
            `;
            appContent.innerHTML = html;
            
            // Auto slide Trending Now
            setTimeout(() => {
                const trendingRow = document.querySelector('#section-trending > div:nth-child(2)');
                if(trendingRow) {
                    setInterval(() => {
                        if(!trendingRow || !trendingRow.isConnected) return;
                        if(trendingRow.scrollLeft + trendingRow.clientWidth >= trendingRow.scrollWidth - 10) {
                            trendingRow.scrollTo({ left: 0, behavior: 'smooth' });
                        } else {
                            trendingRow.scrollBy({ left: 240, behavior: 'smooth' });
                        }
                    }, 3000);
                }
            }, 500);

            injectAd("home-ad-1", window.appSettings?.adHomeTop);
            injectAd("home-ad-2", window.appSettings?.adHomeMiddle);
            injectAd("home-ad-3", window.appSettings?.adHomeBottom);

            // Inject TMDB Collections Async
            injectTMDBFeaturedCollections();
        }

        async function injectTMDBFeaturedCollections() {
            const container = document.getElementById('tmdb-featured-collections');
            if(!container) return;

            let key = (window.appSettings && window.appSettings.tmdbKey) ? window.appSettings.tmdbKey.trim() : 
window.TMDB_API_KEY;
            if(!key || key === 'YOUR_TMDB_API_KEY') key = "eaa427dc2d3150ffec741537c8e0de6d";

            const collections = [
                { title: 'Award Winners & Oscar Nominations', url: `https://api.themoviedb.org/3/discover/movie?api_key=${key}&with_keywords=818&sort_by=popularity.desc` },
                { title: 'Critically Acclaimed Dramas', url: `https://api.themoviedb.org/3/discover/movie?api_key=${key}&with_genres=18&vote_average.gte=8&vote_count.gte=1000&sort_by=popularity.desc` },
                { title: 'Trending Global Blockbusters', url: `https://api.themoviedb.org/3/trending/movie/week?api_key=${key}` }
            ];

            let html = '';
            for (const col of collections) {
                try {
                    const res = await fetch(col.url);
                    const data = await res.json();
                    if(data && data.results && data.results.length > 0) {
                        const items = data.results.slice(0, 15).map(item => ({
                            id: item.id,
                            title: item.title || item.name,
                            poster: item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Image',
                            year: (item.release_date || item.first_air_date || '').split('-')[0],
                            type: item.title ? 'movie' : 'tv'
                        }));
                        
                        let rowHtml = `<div class="mt-8 px-4 md:px-12 relative group z-30">
                            <div class="flex items-center justify-between mb-4">
                                <h2 class="text-xl md:text-2xl font-bold border-l-4 border-netflixRed pl-3">${col.title}</h2>
                                <span class="text-xs font-bold text-netflixRed uppercase tracking-widest bg-netflixRed/10 px-2 py-1 rounded">TMDB Featured</span>
                            </div>
                            <div class="flex gap-2.5 overflow-x-auto no-scrollbar pb-8 pt-2 -mt-2 px-1 -mx-1">`;
                            
                        items.forEach(item => {
                            rowHtml += `
                                <div onclick="openTMDBDetailsModal('${item.type}', '${item.id}', '${item.title.replace(/'/g, "\\'")}')" class="flex-none w-[140px] md:w-[220px] relative rounded-md overflow-hidden transition-all duration-300 card-hover cursor-pointer bg-neutral-900 aspect-[2/3] block group" onmouseenter="startPreview(this, '${item.type}', '${item.id}')" onmouseleave="stopPreview(this)">
                                    <img src="${item.poster}" loading="lazy" class="w-full h-full object-cover group-hover:opacity-50 transition">
                                    <div class="preview-video-wrapper absolute inset-0 z-10 hidden transition-opacity duration-300 bg-black pointer-events-none rounded overflow-hidden"></div>
                                    <div class="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <i class="fas fa-plus-circle text-4xl text-netflixRed mb-2 drop-shadow-lg"></i>
                                        <span class="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">Request</span>
                                    </div>
                                    <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 z-10">
                                        <h3 class="font-bold text-sm line-clamp-1 drop-shadow">${item.title}</h3>
                                        <div class="flex items-center gap-2 text-[10px] text-gray-300 mt-1">
                                            <span>${item.year||''}</span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        rowHtml += `</div></div>`;
                        html += rowHtml;
                    }
                } catch(e) {
                    console.warn("TMDB Fetch Skipped due to network/adblocker");
                }
            }
            if (html) {
                container.innerHTML = html;
            }
        }

        window.openTMDBDetailsModal = function(type, id, title) {
            // Direct user to request page with title
            window.location.hash = '#request';
            
            // Wait for navigation and DOM update
            setTimeout(() => {
                const searchInput = document.getElementById('req-tmdb-search');
                if(searchInput) {
                    searchInput.value = title;
                    // Trigger input event to show results immediately
                    searchInput.dispatchEvent(new Event('input'));
                }
            }, 300);
        }

        function generateRow(title, items, id, exploreLink) {
            if(!items || items.length === 0) return '';
            let rowHtml = `<div ${id ? `id="${id}"` : ''} class="mt-8 px-4 md:px-12 relative group z-30 animate-fade-in-up">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl md:text-2xl font-bold">${title}</h2>
                    ${exploreLink ? `<a href="${exploreLink}" class="text-sm text-gray-400 hover:text-white transition flex items-center gap-1">Explore All <i class="fas fa-chevron-right text-[10px]"></i></a>` : ''}
                </div>
                <div class="flex gap-3 overflow-x-auto no-scrollbar pb-8 pt-2 -mt-2 px-1 -mx-1">`;
            items.forEach(item => {
                const link = item.isCw ? `#watch/${item.type}/${item.id}` : `#${item.type}/${item.id}`;
                rowHtml += `
                    <a href="${link}" class="flex-none w-[140px] md:w-[220px] relative rounded-xl overflow-hidden transition-all duration-300 card-hover cursor-pointer bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] aspect-[2/3] block group" onmouseenter="startPreview(this, '${item.type}', '${item.id}')" onmouseleave="stopPreview(this)">
                        <div class="n-badge z-30"></div>
                        <img src="${item.poster || 'https://via.placeholder.com/300x450?text=No+Image'}" loading="lazy" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity">
                        <div class="preview-video-wrapper absolute inset-0 z-10 hidden transition-opacity duration-300 bg-black pointer-events-none rounded-xl overflow-hidden"></div>
                        
                        <!-- Tags Container (Bottom Left & Right) -->
                        <div class="absolute bottom-2 left-2 flex flex-col gap-1 z-10 transition-transform duration-300 group-hover:-translate-y-12">
                            ${item.hd ? `<span class="bg-black/60 backdrop-blur-md border border-white/20 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">${item.hd === true ? 'HD' : item.hd}</span>` : ''}
                            ${item.audioLang && item.audioLang.length > 0 ? `<span class="bg-netflixRed/80 backdrop-blur-md border border-white/20 text-white text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm line-clamp-1 max-w-[60px]"><i class="fas fa-microphone-alt mr-1"></i>${item.audioLang[0]}</span>` : ''}
                        </div>
                        <div class="absolute bottom-2 right-2 flex flex-col items-end gap-1 z-10 transition-transform duration-300 group-hover:-translate-y-12">
                            ${item.new ? '<div class="bg-netflixRed/90 backdrop-blur-md text-white text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg tracking-wider border border-white/20 animate-pulse">NEW</div>' : ''}
                            ${item.rating ? `<div class="bg-[#f5c518]/90 backdrop-blur-md text-black text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg flex items-center border border-white/20"><i class="fas fa-star text-[8px] mr-1"></i>${item.rating}</div>` : ''}
                        </div>
                        
                        ${item.isCw ? `<div class="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10 backdrop-blur-md z-20"><div class="h-full bg-netflixRed shadow-[0_0_10px_#e50914]" style="width: ${item.progress ? (item.progress/item.duration)*100 : 30}%"></div></div><div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"><button class="bg-white/20 backdrop-blur-xl border border-white/30 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition hover:scale-110 hover:bg-white/30"><i class="fas fa-play ml-1"></i></button></div>` : ''}
                        
                        <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 z-10">
                            <h3 class="font-bold text-sm md:text-base line-clamp-1 drop-shadow-lg text-white">${item.title}</h3>
                            <div class="flex items-center flex-wrap gap-1.5 text-[9px] md:text-[11px] text-gray-300 mt-1.5">
                                ${item.genres && item.genres[0] ? `<span class="text-netflixRed font-semibold">${item.genres[0]}</span><span class="text-gray-500">•</span>` : ''}
                                <span class="border border-white/30 bg-black/40 backdrop-blur-sm px-1.5 rounded">${item.ageRating||'PG-13'}</span>
                                <span class="font-medium">${item.year||''}</span>
                            </div>
                        </div>
                    </a>
                `;
            });
            rowHtml += `</div></div>`;
            return rowHtml;
        }

        function generateTop10Row(title, items, type) {
            let rowHtml = `<div class="mt-12 px-4 md:px-12 relative z-30"><h2 class="text-xl md:text-2xl font-bold mb-4 flex items-center gap-3">${title} <span class="bg-netflixRed text-white text-[10px] px-1.5 py-0.5 rounded font-black tracking-widest shadow">TOP 10</span></h2><div class="flex gap-4 overflow-x-auto no-scrollbar py-4 px-4 -mx-4 pl-8 md:pl-12">`;
            items.forEach((item, index) => {
                rowHtml += `
                    <a href="#${type}/${item.id}" class="flex-none relative flex items-end group cursor-pointer transition-all duration-300 card-hover h-40 md:h-64 mr-4" onmouseenter="startPreview(this, '${type}', '${item.id}')" onmouseleave="stopPreview(this)">
                        <span class="top10-number drop-shadow-2xl">${index + 1}</span>
                        <div class="w-28 md:w-44 h-full bg-neutral-800 rounded relative z-20 overflow-hidden shadow-[0_10px_20px_rgba(0,0,0,0.6)]">
                            <div class="n-badge"></div>
                            ${index === 0 ? '<div class="absolute top-0 left-1/2 -translate-x-1/2 bg-netflixRed text-white text-[8px] font-black px-2 py-1 rounded-b z-10 shadow-md">#1 TODAY</div>' : ''}
                            <img src="${item.poster}" loading="lazy" class="w-full h-full object-cover relative z-0">
                            <div class="preview-video-wrapper absolute inset-0 z-10 hidden transition-opacity duration-300 bg-black pointer-events-none rounded overflow-hidden"></div>
                        </div>
                    </a>
                `;
            });
            rowHtml += `</div></div>`;
            return rowHtml;
        }

        // ==========================
        // DETAILS PAGE (Image 12 Style)
        // ==========================
        async function renderDetails(id, type) {
            const data = await fetchFirebaseData(`${type === 'movie' ? 'movies' : 'tvShows'}/${id}`);
            if(!data) {
                appContent.innerHTML = '<div class="pt-24 md:pt-32 text-center text-2xl">Content not found.</div>';
                return;
            }
            
            let myList = []; try { myList = JSON.parse(localStorage.getItem('nexora_mylist') || '[]'); } catch(e) {}
            const inMyList = myList.some(i => i.id === data.id);
            const listBtnHtml = inMyList ? '<i class="fas fa-check text-green-500"></i> In My List' : '<i class="fas fa-plus"></i> My List';

            let extraHtml = '';

            const castArray = Array.isArray(data.cast) ? data.cast : Object.values(data.cast || {});
            if (castArray.length > 0) {
                extraHtml += `<div class="mt-12 max-w-7xl mx-auto">
                    <h3 class="text-xl md:text-2xl font-bold mb-6 text-gray-200 uppercase tracking-widest"><i class="fas fa-users text-netflixRed mr-2"></i> Top Cast</h3>
                    <div class="flex gap-4 md:gap-6 overflow-x-auto pb-6 custom-scrollbar scroll-smooth" style="-webkit-overflow-scrolling: touch;">
                        ${castArray.map(c => `
                            <div class="flex-shrink-0 w-24 md:w-32 text-center group cursor-pointer">
                                <div class="w-24 h-24 md:w-32 md:h-32 mx-auto rounded-full bg-gray-900 border-2 border-transparent group-hover:border-gray-500 overflow-hidden mb-3 shadow-xl transition-all duration-300">
                                    ${c.image ? `<img src="${c.image}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">` : `<i class="fas fa-user text-4xl md:text-5xl mt-6 md:mt-8 text-gray-700"></i>`}
                                </div>
                                <h4 class="font-bold text-sm md:text-base text-gray-200 line-clamp-1">${c.name}</h4>
                                ${c.role ? `<p class="text-xs md:text-sm text-gray-500 line-clamp-1">${c.role}</p>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>`;
            }

            let watchLink = `#watch/${type}/${data.id}`;

            if(type === 'tv' && data.seasons) {
                // Ensure we get a valid season and ignore nulls
                const validSeasons = Object.values(data.seasons).filter(s => s && s.episodes);
                if(validSeasons.length > 0) {
                    const firstS = validSeasons[0];
                    const firstEKey = Object.keys(firstS.episodes).find(k => firstS.episodes[k]);
                    if (firstEKey) {
                        watchLink = `#watch/tv/${data.id}/${firstS.seasonNumber}/${firstEKey}`;
                    }
                }
                
                let seasonsList = Object.values(data.seasons).filter(s => s);
                
                // Sort seasons by oldest to newest by default
                seasonsList.sort((a,b) => parseInt(a.seasonNumber) - parseInt(b.seasonNumber));
                
                extraHtml += `<div class="mt-16 max-w-7xl mx-auto px-4 md:px-0">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-2 mb-6 gap-4">
                        <h3 class="text-2xl font-bold">Episodes</h3>
                        ${seasonsList.length > 1 ? `
                            <div class="flex gap-2 w-full sm:w-auto">
                                <select id="season-selector" class="flex-1 sm:w-auto bg-gray-900 border border-gray-700 text-white rounded p-2 outline-none focus:border-netflixRed" onchange="showSeason(this.value)">
                                    ${seasonsList.map(s => `<option value="${s.seasonNumber}">Season ${s.seasonNumber}</option>`).join('')}
                                </select>
                                <select id="season-sort" class="bg-gray-900 border border-gray-700 text-white rounded p-2 outline-none focus:border-netflixRed" onchange="sortSeasons(this.value)">
                                    <option value="asc">Oldest to Newest</option>
                                    <option value="desc">Newest to Oldest</option>
                                </select>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                const seasonsHtml = seasonsList.map((season, idx) => {
                    const isFirst = idx === 0;
                    let seasonStr = `<div id="season-container-${season.seasonNumber}" class="season-container ${isFirst ? '' : 'hidden'}">`;
                    
                    if (season.overview) {
                        seasonStr += `<p class="text-gray-400 text-sm md:text-base mb-6 max-w-4xl italic border-l-4 border-netflixRed pl-4">${season.overview}</p>`;
                    } else if (data.overview) {
                        seasonStr += `<p class="text-gray-400 text-sm md:text-base mb-6 max-w-4xl italic border-l-4 border-gray-700 pl-4">Season ${season.seasonNumber} of ${data.title}. ${data.overview.substring(0, 150)}...</p>`;
                    }
                    
                    seasonStr += `<div class="flex flex-col gap-2" id="season-episodes-${season.seasonNumber}">`;
                    
                    if(season.episodes) {
                        let cwList = []; try { cwList = JSON.parse(localStorage.getItem('nexora_continue_watching') || '[]'); } catch(e) {}
                        
                        const episodes = Object.entries(season.episodes).filter(([_, ep]) => ep).sort((a,b) => {
                            const numA = parseInt(a[1].episodeNumber || a[0]);
                            const numB = parseInt(b[1].episodeNumber || b[0]);
                            return numA - numB;
                        });
                        seasonStr += episodes.map(([epKey, ep]) => {
                            const cwItem = cwList.find(c => String(c.id) === String(id) && c.type === 'tv' && String(c.season) === String(season.seasonNumber) && String(c.episode) === String(epKey));
                            const isCurrentlyWatching = !!cwItem;
                            const progressPct = cwItem && cwItem.duration ? (cwItem.progress / cwItem.duration) * 100 : 0;
                            
                            return `
                                <div class="flex flex-row gap-3 md:gap-4 items-center ${isCurrentlyWatching ? 'bg-gray-800 border-netflixRed/50' : 'bg-gray-900/50 border-transparent hover:border-gray-700'} rounded-lg p-2 md:p-4 hover:bg-gray-800/80 transition cursor-pointer border relative overflow-hidden" onclick="window.location.hash='#watch/tv/${id}/${season.seasonNumber}/${epKey}'">
                                    ${isCurrentlyWatching ? '<div class="absolute left-0 top-0 bottom-0 w-1 bg-netflixRed"></div>' : ''}
                                    <h5 class="text-base md:text-2xl ${isCurrentlyWatching ? 'text-netflixRed' : 'text-gray-500'} font-bold w-6 md:w-8 text-center flex-shrink-0">${ep.episodeNumber}</h5>
                                    <div class="w-24 md:w-48 aspect-video bg-black relative rounded overflow-hidden flex-shrink-0 group">
                                        <img src="${ep.still || data.backdrop}" loading="lazy" class="w-full h-full object-cover ${isCurrentlyWatching ? 'opacity-100' : 'opacity-70'} group-hover:opacity-100 transition">
                                        <i class="fas fa-play absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-2xl ${isCurrentlyWatching ? 'opacity-100 text-netflixRed' : 'opacity-0'} group-hover:opacity-100 transition drop-shadow"></i>
                                        ${isCurrentlyWatching && progressPct > 0 ? `<div class="absolute bottom-0 left-0 h-1 bg-netflixRed" style="width: ${progressPct}%"></div>` : ''}
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-0.5 md:mb-2">
                                            <div class="flex flex-wrap items-center gap-1.5 md:gap-2">
                                                <h5 class="font-bold text-sm md:text-lg text-white truncate sm:whitespace-normal">${ep.title}</h5>
                                                ${isCurrentlyWatching ? '<span class="text-[9px] md:text-[10px] font-bold bg-netflixRed text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Watching</span>' : ''}
                                            </div>
                                            <span class="text-gray-400 text-[10px] md:text-sm bg-gray-800/50 md:bg-gray-800 px-1.5 py-0.5 rounded mt-0.5 sm:mt-0 w-fit flex-shrink-0">${ep.runtime||45}m</span>
                                        </div>
                                        <p class="text-gray-500 text-[10px] md:text-sm line-clamp-1 md:line-clamp-3 leading-tight">${ep.overview || ''}</p>
                                    </div>
                                </div>`;
                        }).join('');
                    }
                    seasonStr += `</div></div>`;
                    return seasonStr;
                }).join('');
                
                extraHtml += seasonsHtml;
                extraHtml += `</div>`;
            }

            appContent.innerHTML = `
                <!-- Professional Back Button -->
                <div class="absolute top-24 md:top-28 left-4 md:left-12 z-40">
                    <button onclick="window.history.back()" class="bg-black/80 hover:bg-black/80 text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-lg border border-white/10 hover:scale-110">
                        <i class="fas fa-arrow-left text-lg md:text-xl"></i>
                    </button>
                </div>
                
                <div class="relative w-full min-h-screen bg-[#141414] cinematic-noise pt-20 md:pt-24 pb-16 px-4 md:px-12">
                    <!-- Background Blur & Legibility Gradients -->
                    <div class="absolute inset-0 z-0 h-[60vh] md:h-full overflow-hidden">
                        <img src="${data.backdrop || data.poster}" class="w-full h-full object-cover opacity-20 blur-sm mask-image-b animate-slow-zoom origin-center">
                        <div class="absolute inset-0 bg-black/80"></div>
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/90 to-transparent"></div>
                        <div class="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
                    </div>
                    
                    <div class="relative z-10 max-w-7xl mx-auto flex flex-col mt-4 md:mt-0">
                        <!-- Breadcrumb -->
                        <div class="text-[10px] md:text-sm font-bold text-gray-300 md:text-gray-400 mb-4 md:mb-8 uppercase tracking-widest flex gap-2 items-center">
                            <i class="fas fa-share text-gray-300 md:text-gray-500"></i> ${data.top10Rank ? `<span class="bg-netflixRed text-white px-1.5 py-0.5 rounded text-[10px]">TOP 10</span> MOVIE` : type} • ${data.releaseDate ? new Date(data.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (data.year || '')}
                        </div>

                        <div class="flex flex-col md:flex-row gap-6 md:gap-16 items-start">
                            <!-- Left Poster -->
                            <div class="w-1/2 max-w-[200px] md:w-1/3 lg:w-1/4 flex-shrink-0 mx-auto md:mx-0 shadow-2xl rounded-xl border-2 md:border border-gray-700/50 md:border-gray-800">
                                <img src="${data.poster}" class="w-full rounded-xl">
                            </div>
                            
                            <!-- Right Details -->
                            <div class="w-full md:w-2/3 lg:w-3/4 flex flex-col pt-0 md:pt-4 items-center md:items-start text-center md:text-left">
                                <h1 class="text-3xl sm:text-5xl md:text-7xl font-bold mb-3 md:mb-4 font-sans tracking-tight leading-tight text-white drop-shadow-md">${data.title}</h1>
                                
                                <div class="flex flex-wrap justify-center md:justify-start items-center gap-2 md:gap-4 text-xs md:text-sm font-semibold mb-4 md:mb-6 text-green-500">
                                    <span>${data.releaseDate ? new Date(data.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (data.year || '')}</span>
                                    <span class="text-gray-300">${data.runtime ? `${data.runtime} min` : (data.seasons ? `${Object.keys(data.seasons).length} Seasons` : '')}</span>
                                    
                                    <!-- Interactive Rating -->
                                    <div class="flex items-center gap-2">
                                        <span class="text-yellow-500 flex items-center gap-1"><i class="fas fa-star"></i> ${data.vote_average ? data.vote_average : '8.5'}</span>
                                        <div class="flex items-center ml-1 border-l border-gray-600 pl-2">
                                            <div class="flex flex-row-reverse group">
                                                <i class="fas fa-star text-gray-600 cursor-pointer peer peer-hover:text-yellow-500 hover:text-yellow-500 transition-colors duration-300 text-lg star-rating-icon-${id}" onclick="submitRating('${id}', '${type}', 5)" data-val="5"></i>
                                                <i class="fas fa-star text-gray-600 cursor-pointer peer peer-hover:text-yellow-500 hover:text-yellow-500 transition-colors duration-300 text-lg star-rating-icon-${id}" onclick="submitRating('${id}', '${type}', 4)" data-val="4"></i>
                                                <i class="fas fa-star text-gray-600 cursor-pointer peer peer-hover:text-yellow-500 hover:text-yellow-500 transition-colors duration-300 text-lg star-rating-icon-${id}" onclick="submitRating('${id}', '${type}', 3)" data-val="3"></i>
                                                <i class="fas fa-star text-gray-600 cursor-pointer peer peer-hover:text-yellow-500 hover:text-yellow-500 transition-colors duration-300 text-lg star-rating-icon-${id}" onclick="submitRating('${id}', '${type}', 2)" data-val="2"></i>
                                                <i class="fas fa-star text-gray-600 cursor-pointer peer peer-hover:text-yellow-500 hover:text-yellow-500 transition-colors duration-300 text-lg star-rating-icon-${id}" onclick="submitRating('${id}', '${type}', 1)" data-val="1"></i>
                                            </div>
                                            <span id="rating-thanks-${id}" class="text-green-500 font-bold text-xs ml-2 opacity-0 transition-opacity duration-300" style="pointer-events: none;">Thanks!</span>
                                        </div>
                                    </div>
                                    
                                    <span class="border border-gray-600 text-gray-300 px-1.5 md:px-2 py-0.5 rounded-sm bg-black/80">${data.ageRating||'PG-13'}</span>
                                    ${(function() {
                                        let qualities = new Set();
                                        if (type === 'movie' && data.servers) {
                                            Object.values(data.servers).forEach(s => {
                                                if (s && s.name) {
                                                    const name = s.name.toUpperCase();
                                                    if (name.includes('4K') || name.includes('2160P')) qualities.add('4K');
                                                    else if (name.includes('1080P') || name.includes('FHD')) qualities.add('1080p');
                                                    else if (name.includes('720P') || name.includes('HD')) qualities.add('HD');
                                                    if (name.includes('HDR')) qualities.add('HDR');
                                                }
                                            });
                                        } else if (type === 'tv' && data.seasons) {
                                            Object.values(data.seasons).forEach(season => {
                                                if (season && season.episodes) {
                                                    Object.values(season.episodes).forEach(ep => {
                                                        if (ep && ep.servers) {
                                                            Object.values(ep.servers).forEach(s => {
                                                                if (s && s.name) {
                                                                    const name = s.name.toUpperCase();
                                                                    if (name.includes('4K') || name.includes('2160P')) qualities.add('4K');
                                                                    else if (name.includes('1080P') || name.includes('FHD')) qualities.add('1080p');
                                                                    else if (name.includes('720P') || name.includes('HD')) qualities.add('HD');
                                                                    if (name.includes('HDR')) qualities.add('HDR');
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                        
                                        if (qualities.size === 0) {
                                            return `<span class="border border-gray-600 text-gray-300 px-1.5 md:px-2 py-0.5 rounded-sm bg-black/80 hidden md:inline-block">${data.videoQuality || 'HD'}</span>`;
                                        }
                                        
                                        return Array.from(qualities).map(q => `<span class="border border-gray-600 text-gray-300 px-1.5 md:px-2 py-0.5 rounded-sm bg-black/80 hidden md:inline-block">${q}</span>`).join(' ');
                                    })()}
                                </div>

                                <!-- Mobile Action Buttons -->
                                <div class="flex md:hidden w-full gap-2 mb-4">
                                    <a href="${watchLink}" class="flex-1 bg-white text-black py-2 rounded flex items-center justify-center gap-2 font-bold hover:bg-gray-200 transition text-sm">
                                        <i class="fas fa-play"></i> Play
                                    </a>
                                    <button onclick="toggleMyList('${id}', '${type}')" class="mylist-btn-${id} flex-1 bg-[#2a2a2a] text-white py-2 rounded flex items-center justify-center gap-2 font-bold hover:bg-gray-600 transition text-sm">
                                        ${listBtnHtml}
                                    </button>
                                </div>
                                <div class="flex md:hidden w-full gap-2 mb-6">
                                    <button onclick="openTrailerModal('${data.title || data.name}', '${type}', '${data.year || ''}')" class="flex-1 bg-[#2a2a2a]/80 backdrop-blur border border-gray-600 text-white py-2.5 rounded flex items-center justify-center gap-2 font-bold hover:bg-gray-600 transition shadow-sm text-sm">
                                        <i class="fas fa-film text-netflixRed"></i> Trailer
                                    </button>
                                    <button onclick="shareContent(this)" class="flex-1 bg-transparent backdrop-blur border border-gray-500 text-white py-2.5 rounded flex items-center justify-center gap-2 font-bold hover:bg-white/10 transition shadow-sm text-sm">
                                        <i class="fas fa-share-alt"></i> Share
                                    </button>
                                </div>
                                
                                <p class="text-sm md:text-lg text-gray-300 mb-6 md:mb-8 max-w-3xl leading-relaxed text-shadow-sm text-left">${data.overview}</p>
                                
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-xs md:text-sm text-gray-400 mb-8 max-w-xl text-left w-full">
                                    <div class="flex flex-wrap items-center gap-2 mb-2">
                                        <strong class="text-gray-200 mr-1">Genres:</strong>
                                        ${(data.genres && data.genres.length > 0 ? data.genres : (data.collections || ['Action', 'Drama'])).map(g => `<span class="px-2.5 py-0.5 bg-white/10 hover:bg-white/20 transition-colors border border-white/20 rounded-full text-xs font-medium text-gray-300 cursor-default">${g}</span>`).join('')}
                                    </div>
                                    ${data.audioLang && data.audioLang.length > 0 ? `<p><strong class="text-gray-200">Audio:</strong> ${data.audioLang.join(', ')}</p>` : '<p><strong class="text-gray-200">Language:</strong> English</p>'}
                                    ${data.subLang && data.subLang.length > 0 ? `<p><strong class="text-gray-200">Subtitles:</strong> ${data.subLang.join(', ')}</p>` : ''}
                                    <p><strong class="text-gray-200">Release:</strong> ${data.releaseDate ? new Date(data.releaseDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : (data.year || 'Unknown')}</p>
                                    
                                    <div class="flex items-center gap-3 mt-2 sm:col-span-2">
                                        ${data.imdbId ? `<a href="https://www.imdb.com/title/${data.imdbId}" target="_blank" class="bg-[#f5c518] text-black text-[10px] font-bold px-2 py-0.5 rounded shadow hover:bg-yellow-500 transition">IMDb</a>` : ''}
                                        ${data.tmdbId ? `<a href="https://www.themoviedb.org/${type === 'movie' ? 'movie' : 'tv'}/${data.tmdbId}" target="_blank" class="bg-[#032541] text-[#01b4e4] border border-[#01b4e4] text-[10px] font-bold px-2 py-0.5 rounded shadow hover:bg-[#01b4e4] hover:text-black transition">TMDB</a>` : ''}
                                    </div>
                                    
                                    ${data.status === 'coming_soon' && data.releaseDate ? `
                                        <div class="sm:col-span-2 mt-4 p-4 bg-gray-900/80 border border-netflixRed/50 rounded-lg">
                                            <p class="text-netflixRed font-bold mb-2 uppercase tracking-widest text-[10px] flex items-center"><i class="fas fa-clock mr-2 animate-pulse"></i> Coming Soon</p>
                                            <div id="countdown-timer" class="flex gap-4 text-white font-mono text-xl md:text-2xl" data-date="${data.releaseDate}">
                                                <!-- Countdown injected here by JS -->
                                            </div>
                                        </div>
                                    ` : ''}
                                </div>
                                
                                <!-- Desktop Action Buttons -->
                                <div class="hidden md:flex flex-wrap gap-4">
                                    <a href="${watchLink}" class="bg-white text-black px-8 py-3 rounded-md flex items-center gap-3 font-bold hover:bg-white transition-all duration-300 text-lg shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.7)] hover:scale-105 active:scale-95 group"><i class="fas fa-play group-hover:scale-110 transition-transform"></i> Play</a>
                                        
                                    <button onclick="openTrailerModal('${data.title || data.name}', '${type}', '${data.year || ''}')" class="bg-[rgba(109,109,110,0.7)] text-white px-8 py-3 rounded-md flex items-center gap-3 font-bold hover:bg-[rgba(109,109,110,0.9)] transition-all duration-300 text-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 group"><i class="fas fa-film group-hover:scale-110 transition-transform"></i> More Info</button>
                                        
                                    <button onclick="toggleMyList('${id}', '${type}')" class="mylist-btn-${id} bg-transparent border border-gray-500 text-white px-8 py-3 rounded flex items-center gap-3 font-bold hover:bg-white/10 transition text-lg shadow-sm hover:scale-105 active:scale-95 duration-200">
                                        ${listBtnHtml}
                                    </button>
                                    <button onclick="shareContent(this)" class="bg-[rgba(109,109,110,0.3)] border border-gray-500 text-white px-8 py-3 rounded-md flex items-center gap-3 font-bold hover:bg-[rgba(109,109,110,0.6)] transition-all duration-300 text-lg shadow-sm hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 group">
                                        <i class="fas fa-share-alt"></i> Share
                                    </button>
                                </div>
                                
                                
                                
                            </div>
                        </div>
                        
                        <div class="mt-8 md:mt-0">
                            ${extraHtml}
                        </div>
                    </div>
                </div>
            `;

            
            // Countdown Timer Logic
            if(data.status === 'coming_soon' && data.releaseDate) {
                const countDownDate = new Date(data.releaseDate).getTime();
                const timerEl = document.getElementById('countdown-timer');
                
                if (window.currentCountdown) clearInterval(window.currentCountdown);
                
                window.currentCountdown = setInterval(function() {
                    const now = new Date().getTime();
                    const distance = countDownDate - now;

                    if (distance < 0) {
                        clearInterval(window.currentCountdown);
                        if(timerEl) timerEl.innerHTML = "RELEASED!";
                        return;
                    }

                    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

                    if(timerEl) {
                        timerEl.innerHTML = `
                            <div class="flex flex-col items-center"><span>${days}</span><span class="text-[10px] text-gray-500 uppercase">Days</span></div>
                            <div class="flex flex-col items-center"><span>${hours}</span><span class="text-[10px] text-gray-500 uppercase">Hrs</span></div>
                            <div class="flex flex-col items-center"><span>${minutes}</span><span class="text-[10px] text-gray-500 uppercase">Min</span></div>
                            <div class="flex flex-col items-center"><span>${seconds}</span><span class="text-[10px] text-gray-500 uppercase">Sec</span></div>
                        `;
                    } else {
                        clearInterval(window.currentCountdown);
                    }
                }, 1000);
            }

            // MORE LIKE THIS LOGIC
            const movies = await fetchFirebaseData('movies') || {};
            const tvShows = await fetchFirebaseData('tvShows') || {};
            const allContent = [
                ...Object.values(movies).filter(m => m && m.status !== 'draft').map(m => ({...m, type: 'movie'})),
                ...Object.values(tvShows).filter(t => t && t.status !== 'draft').map(t => ({...t, type: 'tv'}))
            ];
            
            window.moreLikeThisData = { allContent, currentItem: data };
            
            const myGenres = data.collections || data.genres || [];
            const myCast = data.cast ? (Array.isArray(data.cast) ? data.cast : Object.values(data.cast)).map(c => c.name) : [];
            
            let hasGenreMatches = false;
            let hasCastMatches = false;
            
            let genreItems = [];
            let castItems = [];

            if(myGenres.length > 0) {
                genreItems = allContent.filter(item => {
                    if(item.id === data.id) return false;
                    const itemGenres = item.collections || item.genres || [];
                    return myGenres.some(g => itemGenres.includes(g));
                }).slice(0, 15);
                hasGenreMatches = genreItems.length > 0;
            }
            
            if(myCast.length > 0) {
                castItems = allContent.filter(item => {
                    if(item.id === data.id) return false;
                    const itemCast = item.cast ? (Array.isArray(item.cast) ? item.cast : Object.values(item.cast)).map(c => c.name) : [];
                    return myCast.some(c => itemCast.includes(c));
                }).slice(0, 15);
                hasCastMatches = castItems.length > 0;
            }
            
            if(hasGenreMatches || hasCastMatches) {
                const defaultFilter = hasGenreMatches ? 'genre' : 'cast';
                const defaultItems = defaultFilter === 'genre' ? genreItems : castItems;
                
                window.cachedGenreItems = genreItems;
                window.cachedCastItems = castItems;
                
                let toggleHtml = `
                    <div class="mt-8 px-4 md:px-12 relative z-30 mb-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 class="text-xl md:text-2xl font-bold border-l-4 border-netflixRed pl-3">More Like This</h2>
                        ${(hasGenreMatches && hasCastMatches) ? `
                        <div class="flex items-center gap-6 border-b border-gray-800 w-full md:w-auto mt-4 md:mt-0">
                            <button onclick="switchMoreLikeThis('genre', this)" class="mlt-btn active text-white font-bold text-sm md:text-base py-2 md:py-3 border-b-4 border-netflixRed transition-colors duration-300 flex items-center gap-2"><i class="fas fa-tags text-sm"></i> By Genre</button>
                            <button onclick="switchMoreLikeThis('cast', this)" class="mlt-btn text-gray-500 font-bold text-sm md:text-base py-2 md:py-3 border-b-4 border-transparent hover:text-gray-300 transition-colors duration-300 flex items-center gap-2"><i class="fas fa-users text-sm"></i> By Cast</button>
                            <button onclick="switchMoreLikeThis('all', this)" class="mlt-btn text-gray-500 font-bold text-sm md:text-base py-2 md:py-3 border-b-4 border-transparent hover:text-gray-300 transition-colors duration-300 flex items-center gap-2"><i class="fas fa-layer-group text-sm"></i> All</button>
                        </div>
                        ` : ''}
                    </div>
                `;
                
                const itemsHtml = `<div id="mlt-grid-container">${window.generateItemsGridHtml(defaultItems)}</div>`;
                
                const container = document.createElement('div');
                container.innerHTML = toggleHtml + itemsHtml;
                const targetEl = appContent.querySelector('.max-w-7xl');
                if(targetEl) targetEl.appendChild(container);
            }
        }

        // ==========================
        // PLAYER PAGE (Image 13 Style)
        // ==========================
        async function renderPlayer(type, id, season, episode) {
            saveContinueWatching(id, type);
            let servers = [];
            setTimeout(() => {
                if (window.self !== window.top) {
                    const warn = document.getElementById('sandbox-warning');
                    if(warn) warn.classList.remove('hidden');
                }
            }, 500);
            let itemDetails = null;
            let epTitle = '';

            if (type === 'movie') {
                const data = await fetchFirebaseData(`movies/${id}`);
                if(data && data.servers) servers = Object.values(data.servers).filter(s=>s && s.enabled);
                itemDetails = data;
            } else {
                const data = await fetchFirebaseData(`tvShows/${id}`);
                itemDetails = data;
                
                // Find season safely to handle Firebase array coercion/shifting
                const seasonObj = data && data.seasons ? Object.values(data.seasons).find(s => s && s.seasonNumber == season) : null;
                
                if(seasonObj && seasonObj.episodes && seasonObj.episodes[episode]) {
                    const epData = seasonObj.episodes[episode];
                    if(epData.servers) servers = Object.values(epData.servers).filter(s=>s && s.enabled);
                    epTitle = `S${season} E${epData.episodeNumber || episode} - ${epData.title}`;
                }
            }

            let tvEpisodesHtml = '';
            if (type === 'tv' && itemDetails && itemDetails.seasons) {
                const seasonsList = Object.values(itemDetails.seasons).filter(s => s && s.episodes);
                seasonsList.sort((a,b) => parseInt(a.seasonNumber) - parseInt(b.seasonNumber));
                
                tvEpisodesHtml = `<div class="max-w-7xl mx-auto px-6 md:px-10 pb-20 mt-8">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-800 pb-2 mb-6 gap-4">
                        <h3 class="text-2xl font-bold">Episodes</h3>
                        ${seasonsList.length > 1 ? `
                            <div class="flex gap-2 w-full sm:w-auto">
                                <select id="watch-season-selector" class="flex-1 sm:w-auto bg-gray-900 border border-gray-700 text-white rounded p-2 outline-none focus:border-netflixRed" onchange="showSeason(this.value)">
                                    ${seasonsList.map(s => `<option value="${s.seasonNumber}" ${String(s.seasonNumber) === String(season) ? 'selected' : ''}>Season ${s.seasonNumber}</option>`).join('')}
                                </select>
                            </div>
                        ` : ''}
                    </div>
                `;

                seasonsList.forEach(sData => {
                    const isVisible = String(sData.seasonNumber) === String(season);
                    tvEpisodesHtml += `<div id="season-container-${sData.seasonNumber}" class="season-container ${isVisible ? '' : 'hidden'}">`;
                    tvEpisodesHtml += `<div class="flex flex-col gap-2">`;
                    
                    if(sData && sData.episodes) {
                        const sortedEpisodes = Object.entries(sData.episodes)
                            .filter(([_, ep]) => ep)
                            .sort((a,b) => parseInt(a[1].episodeNumber || a[0]) - parseInt(b[1].episodeNumber || b[0]));
                        
                        sortedEpisodes.forEach(([epKey, ep]) => {
                            const isCurrent = (epKey === episode && String(sData.seasonNumber) === String(season));
                            tvEpisodesHtml += `
                                <div class="flex flex-row gap-3 md:gap-4 items-center bg-gray-900/50 rounded-lg p-2 md:p-3 hover:bg-gray-800/80 transition cursor-pointer border ${isCurrent ? 'border-netflixRed bg-gray-800/80' : 'border-transparent hover:border-gray-700'}" onclick="window.location.hash='#watch/tv/${id}/${sData.seasonNumber}/${epKey}'">
                                    ${isCurrent ? '<div class="absolute left-0 top-0 bottom-0 w-1 bg-netflixRed rounded-l-lg"></div>' : ''}
                                    <h5 class="text-base md:text-xl text-gray-500 font-bold w-6 md:w-8 text-center flex-shrink-0 ${isCurrent ? 'text-netflixRed' : ''}">${ep.episodeNumber}</h5>
                                    <div class="w-24 md:w-32 aspect-video bg-black relative rounded overflow-hidden flex-shrink-0 group">
                                        <img src="${ep.still || itemDetails.backdrop}" class="w-full h-full object-cover ${isCurrent ? 'opacity-100' : 'opacity-70'} group-hover:opacity-100 transition">
                                        ${isCurrent ? '<div class="absolute inset-0 flex items-center justify-center bg-black/40"><i class="fas fa-play text-netflixRed drop-shadow"></i></div>' : '<i class="fas fa-play absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition drop-shadow"></i>'}
                                    </div>
                                    <div class="flex-1 min-w-0 py-1">
                                        <div class="flex flex-wrap items-center gap-1.5 md:gap-2">
                                            <h5 class="font-bold text-sm md:text-base truncate ${isCurrent ? 'text-white' : 'text-gray-300'}">${ep.title}</h5>
                                            ${isCurrent ? '<span class="text-[9px] md:text-[10px] font-bold bg-netflixRed text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Playing</span>' : ''}
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                    }
                    tvEpisodesHtml += `</div></div>`;
                });
                tvEpisodesHtml += `</div>`;
            }

            if(servers.length === 0) {
                appContent.innerHTML = `<div class="h-screen bg-[#141414] flex flex-col items-center justify-center text-white"><i class="fas fa-video-slash text-6xl text-gray-700 mb-6"></i><h2 class="text-2xl mb-4 font-bold">No video servers available.</h2><p class="text-gray-500 mb-8">This content has not been uploaded yet.</p><a href="#${type}/${id}" class="bg-netflixRed text-white px-8 py-3 rounded font-bold inline-block">Go Back</a></div>`;
                return;
            }

            appContent.innerHTML = `
                <div class="min-h-screen bg-[#141414] pt-24 pb-12">
                    <!-- Top Navigation Bar for Player -->
                    <div id="player-top-ad" class="max-w-7xl mx-auto mb-4 flex justify-center empty:hidden"></div>
                    <div class="max-w-7xl mx-auto px-4 md:px-0 mb-6 flex items-center justify-between">
                        <a href="#${type}/${id}" class="bg-gray-800/80 hover:bg-gray-700 text-white px-5 py-2.5 rounded flex items-center gap-2 font-bold transition shadow-lg">
                            <i class="fas fa-arrow-left"></i> Go Back
                        </a>
                    </div>
                    
                    <!-- Video Player Container -->
                    
                    
<div class="w-full max-w-7xl mx-auto aspect-video bg-black relative shadow-2xl" id="video-wrapper">
                        <video id="main-video" class="w-full h-full object-contain bg-black"></video>
                        
                        <!-- Overlay controls -->
                        <div class="absolute inset-0 bg-black/60 flex items-center justify-center z-10" id="play-overlay">
                            <button class="bg-netflixRed/90 hover:bg-netflixRed text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(229,9,20,0.5)] transition hover:scale-110" id="big-play-btn">
                                <i class="fas fa-play ml-1"></i>
                            </button>
                        </div>
                        
                        <!-- Top Left Back Button (Inside video for fullscreen support) -->
                        <button onclick="if(document.fullscreenElement) document.exitFullscreen(); else window.location.hash = '#'+type+'/'+id;" class="absolute top-6 left-6 z-20 text-white/70 hover:text-white bg-black/80 w-10 h-10 rounded-full flex items-center justify-center transition">
                            <i class="fas fa-arrow-left"></i>
                        </button>

                        <!-- Standard UI Controls (Bottom) -->
                        <div class="absolute bottom-0 w-full p-4 md:p-6 video-controls flex flex-col gap-2 bg-gradient-to-t from-black/90 to-transparent z-20">
                            <div class="flex items-center gap-4">
                                <span id="time-current" class="text-white text-xs font-mono">00:00</span>
                                <div class="flex-1 relative group h-1.5 bg-gray-600 rounded cursor-pointer" id="seek-container">
                                    <div class="absolute top-0 left-0 h-full bg-netflixRed rounded" id="seek-progress" style="width: 0%"></div>
                                    <input type="range" id="seek-bar" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" value="0" min="0" max="100">
                                </div>
                                <span id="time-total" class="text-white text-xs font-mono">00:00</span>
                            </div>
                            <div class="flex justify-between items-center text-white mt-2">
                                <div class="flex items-center gap-4 md:gap-6">
                                    <button id="prev-ep" class="text-xl hover:text-white text-gray-400 transition hidden" title="Previous Episode"><i class="fas fa-step-backward"></i></button>
                                    <button id="play-pause" class="text-2xl hover:text-white text-gray-300 transition"><i class="fas fa-play"></i></button>
                                    <button id="next-ep" class="text-xl hover:text-white text-gray-400 transition hidden" title="Next Episode"><i class="fas fa-step-forward"></i></button>
                                    <button id="rewind" class="text-lg hover:text-white text-gray-300 transition hidden sm:block"><i class="fas fa-undo"></i></button>
                                    <button id="forward" class="text-lg hover:text-white text-gray-300 transition hidden sm:block"><i class="fas fa-redo"></i></button>
                                    <div class="flex items-center gap-2 group/vol relative">
                                        <button id="mute" class="text-xl hover:text-gray-300"><i class="fas fa-volume-up"></i></button>
                                    </div>
                                </div>
                                <div class="flex items-center gap-6">
                                    <div id="autoplay-container" class="hidden items-center gap-2 mr-2 text-sm">
                                        <label class="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" id="autoplay-toggle" class="sr-only peer" checked>
                                            <div class="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-netflixRed"></div>
                                            <span class="ml-2 text-xs font-medium text-gray-300 hidden md:block">Autoplay Next</span>
                                        </label>
                                    </div>
                                    <button id="audio-mode-btn" class="text-xl hover:text-netflixRed transition" title="Audio Only / Background Play">
                                        <i class="fas fa-headphones"></i>
                                    </button>
                                    <button id="fullscreen" class="text-xl hover:text-gray-300"><i class="fas fa-expand"></i></button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Details Below Player -->
                    <div id="player-bottom-ad" class="max-w-7xl mx-auto mt-4 flex justify-center empty:hidden"></div>
                    <div class="max-w-7xl mx-auto p-6 md:p-10 border-t border-gray-800 mt-4 flex flex-col md:flex-row gap-8 justify-between items-start">
                        <div class="w-full min-w-0 md:flex-1">
                            <h1 class="text-3xl md:text-4xl font-bold mb-2 break-words">${itemDetails?.title || 'Video'}</h1>
                            ${epTitle ? `<h2 class="text-xl text-netflixRed mb-4 font-bold">${epTitle}</h2>` : ''}
                            <p class="text-gray-400 max-w-2xl text-sm leading-relaxed">${itemDetails?.overview || ''}</p>
                            ${(itemDetails && itemDetails.cast && (Array.isArray(itemDetails.cast) ? itemDetails.cast : Object.values(itemDetails.cast)).length > 0) ? 
                            `<div class="mt-6">
                                <h3 class="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Cast</h3>
                                <div class="flex gap-4 overflow-x-auto pb-4 custom-scrollbar" style="-webkit-overflow-scrolling: touch;">
                                    ${(Array.isArray(itemDetails.cast) ? itemDetails.cast : Object.values(itemDetails.cast)).map(c => 
                                        `<div class="flex-shrink-0 w-20 md:w-24 text-center cursor-pointer group">
                                            <div class="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full bg-gray-900 border border-gray-800 overflow-hidden mb-2 shadow-lg">
                                                ${c.image ? `<img src="${c.image}" class="w-full h-full object-cover group-hover:scale-110 transition">` : `<i class="fas fa-user text-3xl mt-6 text-gray-700"></i>`}
                                            </div>
                                            <h4 class="font-bold text-xs md:text-sm text-gray-300 line-clamp-1">${c.name}</h4>
                                        </div>`
                                    ).join('')}
                                </div>
                            </div>` : ''}
                        </div>
                        
                        <div class="bg-gray-900 border border-gray-700 p-4 rounded-lg w-full md:w-auto md:min-w-[300px]">
                            <h3 class="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2"><i class="fas fa-server"></i> Select Server</h3>
                            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                ${servers.map((s,i) => `
                                    <button onclick="changeVideoServer(${i})" id="server-btn-${i}" class="server-btn relative overflow-hidden flex flex-col items-center justify-center border rounded p-2 transition-all ${i === 0 ? 'bg-netflixRed/10 text-white border-netflixRed shadow-[0_0_15px_rgba(229,9,20,0.2)]' : 'bg-black text-gray-400 border-gray-700 hover:text-white hover:border-gray-500'}">
                                        <div class="font-bold text-sm z-10">${s.name}</div>
                                        ${s.name.toUpperCase().includes('4K') || s.name.toUpperCase().includes('2160P') ? '<div class="text-[9px] text-yellow-500 mt-0.5 uppercase tracking-wider font-bold z-10"><i class="fas fa-bolt mr-1"></i>Ultra HD</div>' : '<div class="text-[9px] text-gray-500 mt-0.5 uppercase tracking-wider font-bold z-10">Standard</div>'}
                                        ${i === 0 ? '<div class="absolute inset-0 bg-gradient-to-br from-netflixRed/20 to-transparent"></div>' : ''}
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    
                    ${tvEpisodesHtml}
                    <!-- Suggested Content (More Like This) -->
                    <div class="max-w-7xl mx-auto p-6 md:p-10 border-t border-gray-800 mt-4">
                        <h3 class="text-xl md:text-2xl font-bold mb-6 text-gray-200"><i class="fas fa-layer-group text-netflixRed mr-2"></i> More Like This</h3>
                        <div id="player-suggestions" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                            <!-- Injected later -->
                        </div>
                    </div>
                </div>
            `;

            // Fetch and inject suggestions
            setTimeout(async () => {
                const movies = await fetchFirebaseData('movies') || {};
                const tvShows = await fetchFirebaseData('tvShows') || {};
                let allContent = [
                    ...Object.values(movies).filter(m => m && m.status !== 'draft').map(m => ({...m, type: 'movie'})),
                    ...Object.values(tvShows).filter(t => t && t.status !== 'draft').map(t => ({...t, type: 'tv'}))
                ];
                allContent = allContent.filter(i => i.id !== id);
                allContent = allContent.sort(() => Math.random() - 0.5).slice(0, 12);
                
                const suggContainer = document.getElementById('player-suggestions');
                if(suggContainer && typeof window.generateItemsGridHtml !== 'undefined') {
                    const fullHtml = window.generateItemsGridHtml(allContent);
                    const match = fullHtml.match(/<div class="grid[^>]+>([\s\S]*?)<\/div><\/div>/);
                    suggContainer.innerHTML = match ? match[1] : '';
                }
            }, 500);

            
            
            injectAd("player-top-ad", window.appSettings?.adPlayerTop);
            injectAd("player-bottom-ad", window.appSettings?.adPlayerBottom);
            
            initPlayer(servers, itemDetails, epTitle);
            
            if (type === 'tv' && itemDetails && itemDetails.seasons) {
                const seasonsList = Object.values(itemDetails.seasons).filter(s => s != null);
                const sData = seasonsList.find(s => s.seasonNumber == season);
                
                if (sData && sData.episodes) {
                    const epKeys = Object.keys(sData.episodes).sort((a,b) => parseInt(sData.episodes[a].episodeNumber) - parseInt(sData.episodes[b].episodeNumber));
                    const currentIndex = epKeys.indexOf(episode);
                    
                    const prevBtn = document.getElementById('prev-ep');
                    const nextBtn = document.getElementById('next-ep');
                    
                    // Determine Next Episode
                    let nextEpHash = null;
                    if (currentIndex !== -1 && currentIndex < epKeys.length - 1) {
                        nextEpHash = `#watch/tv/${id}/${season}/${epKeys[currentIndex + 1]}`;
                    } else {
                        const nextSeasonNum = parseInt(season) + 1;
                        const nextSeason = seasonsList.find(s => s.seasonNumber == nextSeasonNum);
                        if (nextSeason && nextSeason.episodes) {
                            const nextSEpKeys = Object.keys(nextSeason.episodes).sort((a,b) => parseInt(nextSeason.episodes[a].episodeNumber) - parseInt(nextSeason.episodes[b].episodeNumber));
                            if (nextSEpKeys.length > 0) {
                                nextEpHash = `#watch/tv/${id}/${nextSeasonNum}/${nextSEpKeys[0]}`;
                            }
                        }
                    }
                    
                    if (nextEpHash) {
                        nextBtn.classList.remove('hidden');
                        nextBtn.onclick = () => window.location.hash = nextEpHash;
                    }
                    
                    // Determine Prev Episode
                    let prevEpHash = null;
                    if (currentIndex > 0) {
                        prevEpHash = `#watch/tv/${id}/${season}/${epKeys[currentIndex - 1]}`;
                    } else {
                        const prevSeasonNum = parseInt(season) - 1;
                        const prevSeason = seasonsList.find(s => s.seasonNumber == prevSeasonNum);
                        if (prevSeason && prevSeason.episodes) {
                            const prevSEpKeys = Object.keys(prevSeason.episodes).sort((a,b) => parseInt(prevSeason.episodes[a].episodeNumber) - parseInt(prevSeason.episodes[b].episodeNumber));
                            if (prevSEpKeys.length > 0) {
                                prevEpHash = `#watch/tv/${id}/${prevSeasonNum}/${prevSEpKeys[prevSEpKeys.length - 1]}`;
                            }
                        }
                    }
                    
                    if (prevEpHash) {
                        prevBtn.classList.remove('hidden');
                        prevBtn.onclick = () => window.location.hash = prevEpHash;
                    }
                }
            }


            if (type === 'tv' && itemDetails && itemDetails.seasons) {
                const autoplayContainer = document.getElementById('autoplay-container');
                if (autoplayContainer) {
                    autoplayContainer.classList.remove('hidden');
                    autoplayContainer.classList.add('flex');
                }
                const video = document.getElementById('main-video');
                video.addEventListener('ended', () => {
                    const autoplayToggle = document.getElementById('autoplay-toggle');
                    if (autoplayToggle && !autoplayToggle.checked) return;

                    const seasonsList = Object.values(itemDetails.seasons).filter(s => s != null);
                    const sData = seasonsList.find(s => s.seasonNumber == season);
                    if (sData && sData.episodes) {
                        const epKeys = Object.keys(sData.episodes).sort((a,b) => parseInt(sData.episodes[a].episodeNumber) - parseInt(sData.episodes[b].episodeNumber));
                        const currentIndex = epKeys.indexOf(episode);
                        if (currentIndex !== -1 && currentIndex + 1 < epKeys.length) {
                            const nextEp = epKeys[currentIndex + 1];
                            window.location.hash = `#watch/tv/${id}/${season}/${nextEp}`;
                        } else {
                            const nextSeasonNum = parseInt(season) + 1;
                            const nextSeason = seasonsList.find(s => s.seasonNumber == nextSeasonNum);
                            if (nextSeason && nextSeason.episodes) {
                                const nextSEpKeys = Object.keys(nextSeason.episodes).sort((a,b) => parseInt(nextSeason.episodes[a].episodeNumber) - parseInt(nextSeason.episodes[b].episodeNumber));
                                if (nextSEpKeys.length > 0) {
                                    window.location.hash = `#watch/tv/${id}/${nextSeasonNum}/${nextSEpKeys[0]}`;
                                }
                            }
                        }
                    }
                });
            }
        }

        
            

        function initPlayer(servers, itemDetails, epTitle) {
            // --- CONTINUE WATCHING TRACKER ---
            if (itemDetails) {
                try {
                    let cwList = JSON.parse(localStorage.getItem('nexora_continue_watching') || '[]');
                    const itemId = itemDetails.id || itemDetails.name || String(Date.now());
                    cwList = cwList.filter(item => item.id !== itemId);
                    
                    const cwItem = {
                        id: itemId,
                        title: itemDetails.title || itemDetails.name || '',
                        poster: itemDetails.poster || itemDetails.backdrop || '',
                        backdrop: itemDetails.backdrop || '',
                        type: itemDetails.title ? 'movie' : 'tv',
                        year: itemDetails.year || '',
                        lastWatched: Date.now()
                    };
                    
                    cwList.unshift(cwItem);
                    if(cwList.length > 20) cwList = cwList.slice(0, 20);
                    localStorage.setItem('nexora_continue_watching', JSON.stringify(cwList));
                } catch(e) {}
            }

            const video = document.getElementById('main-video');
            const playPauseBtn = document.getElementById('play-pause');
            const bigPlayBtn = document.getElementById('big-play-btn');
            const overlay = document.getElementById('play-overlay');
            const seekBar = document.getElementById('seek-bar');
            const seekProgress = document.getElementById('seek-progress');
            const timeCurrent = document.getElementById('time-current');
            const timeTotal = document.getElementById('time-total');
            const wrapper = document.getElementById('video-wrapper');
            const audioModeBtn = document.getElementById('audio-mode-btn');
            let hls;
            let isAudioMode = false;
            
            // Audio Mode Toggle
            if (audioModeBtn) {
                audioModeBtn.addEventListener('click', () => {
                    isAudioMode = !isAudioMode;
                    if (isAudioMode) {
                        video.style.opacity = '0';
                        wrapper.style.backgroundImage = `url('${itemDetails?.backdrop || itemDetails?.poster || ''}')`;
                        wrapper.style.backgroundSize = 'cover';
                        wrapper.style.backgroundPosition = 'center';
                        // Add overlay to darken the backdrop
                        if (!document.getElementById('audio-overlay')) {
                            const ao = document.createElement('div');
                            ao.id = 'audio-overlay';
                            ao.className = 'absolute inset-0 bg-black/60 z-0 flex items-center justify-center';
                            ao.innerHTML = '<i class="fas fa-music text-6xl text-white/50 drop-shadow-lg animate-pulse"></i>';
                            wrapper.insertBefore(ao, video);
                        }
                        document.getElementById('audio-overlay').style.display = 'flex';
                        audioModeBtn.innerHTML = '<i class="fas fa-video"></i>';
                        audioModeBtn.title = "Video Mode";
                        video.setAttribute('playsinline', 'true');
                    } else {
                        video.style.opacity = '1';
                        wrapper.style.backgroundImage = 'none';
                        const ao = document.getElementById('audio-overlay');
                        if (ao) ao.style.display = 'none';
                        audioModeBtn.innerHTML = '<i class="fas fa-headphones"></i>';
                        audioModeBtn.title = "Audio Only / Background Play";
                        video.removeAttribute('playsinline');
                    }
                });
            }

            // Media Session API for Background Play
            if ('mediaSession' in navigator) {
                const titleStr = epTitle ? `${itemDetails?.title} - ${epTitle}` : (itemDetails?.title || 'Playing Media');
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: titleStr,
                    artist: 'Nexflix Streaming',
                    album: itemDetails?.title || 'Nexflix',
                    artwork: [
                        { src: itemDetails?.backdrop || itemDetails?.poster || 'https://via.placeholder.com/512', sizes: '512x512', type: 'image/jpeg' }
                    ]
                });
                navigator.mediaSession.setActionHandler('play', () => { video.play(); });
                navigator.mediaSession.setActionHandler('pause', () => { video.pause(); });
                navigator.mediaSession.setActionHandler('seekbackward', (details) => {
                    video.currentTime = Math.max(video.currentTime - (details.seekOffset || 10), 0);
                });
                navigator.mediaSession.setActionHandler('seekforward', (details) => {
                    video.currentTime = Math.min(video.currentTime + (details.seekOffset || 10), video.duration);
                });
            }

            // Play Logic
            const togglePlay = () => {
                if (video.paused) { 
                    if(!video.src && !hls) return;
                    video.play().catch(e => console.log(e)); 
                    overlay.style.display = 'none';
                } else { 
                    video.pause(); 
                }
            };

            function loadSource(index) {
                window.hasRestoredProgressForThisVideo = false;
                const server = servers[index];
                
                if (!server || !server.url) {
                    overlay.style.display = 'flex';
                    overlay.innerHTML = `<div class="text-center text-white p-6 max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-lg shadow-2xl backdrop-blur"><i class="fas fa-exclamation-triangle text-4xl mb-4 text-red-500"></i><h3 class="text-xl font-bold mb-2">Video Not Found</h3><p class="text-gray-400 text-sm">The video source URL is missing or empty. Please update the server URL in the admin panel.</p></div>`;
                    return;
                }
                
                // Reset Video & Iframe
                if(hls) hls.destroy();
                video.pause();
                video.removeAttribute('src');
                video.load();
                video.style.display = 'none';
                
                let iframe = document.getElementById('embed-iframe');
                if(!iframe) {
                    iframe = document.createElement('iframe');
                    iframe.id = 'embed-iframe';
                    iframe.className = 'w-full h-full absolute inset-0 z-0 bg-black';
                    iframe.setAttribute('allowfullscreen', 'true');
                    iframe.setAttribute('scrolling', 'no');
                    iframe.setAttribute('frameborder', '0');
                                                                                wrapper.insertBefore(iframe, video);
                }
                iframe.style.display = 'none';

                let finalUrl = server.url;
                if (finalUrl.includes('<iframe')) {
                    const match = finalUrl.match(/src=["'](.*?)["']/);
                    if (match) finalUrl = match[1];
                }
                const urlStr = finalUrl.toLowerCase();
                const isEmbed = urlStr.includes('youtube.com') || urlStr.includes('embed') || urlStr.includes('vidsrc') || urlStr.includes('vimeo.com') || (!urlStr.endsWith('.mp4') && !urlStr.endsWith('.m3u8') && !urlStr.endsWith('.webm') && !urlStr.endsWith('.ogg') && !urlStr.endsWith('.mkv') && !urlStr.includes('blob:'));
                
                if (isEmbed) {
                    iframe.src = finalUrl;
                    iframe.style.display = 'block';
                    overlay.style.display = 'none';
                    // Hide custom controls for iframe
                    document.querySelector('.video-controls').style.display = 'none';
                } else {
                    video.style.display = 'block';
                    document.querySelector('.video-controls').style.display = 'flex';
                    overlay.style.display = 'flex';
                    overlay.innerHTML = `<button class="bg-netflixRed/90 hover:bg-netflixRed text-white rounded-full w-20 h-20 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(229,9,20,0.5)] transition hover:scale-110" id="big-play-btn"><i class="fas fa-play ml-1"></i></button>`;
                    document.getElementById('big-play-btn').addEventListener('click', togglePlay);

                    
                    const tryRestoreProgress = () => {
                        if (window.hasRestoredProgressForThisVideo) return;
                        try {
                            let cw = JSON.parse(localStorage.getItem('nexora_continue_watching') || '[]');
                            let currentCw = cw.find(c => c.id === id && c.type === type && (type === 'movie' || (c.season == season && c.episode == episode)));
                            if (currentCw && currentCw.progress) {
                                video.currentTime = currentCw.progress;
                            }
                        } catch(e) {}
                        window.hasRestoredProgressForThisVideo = true;
                    };
                    video.addEventListener('loadedmetadata', tryRestoreProgress, {once: true});
                    video.addEventListener('canplay', tryRestoreProgress, {once: true});

                    const playPromise = video.paused;
                    
                    if (Hls.isSupported() && ((server.type && server.type.toLowerCase() === 'hls') || urlStr.endsWith('.m3u8'))) {
                        hls = new Hls();
                        hls.loadSource(finalUrl);
                        hls.attachMedia(video);
                        if(!playPromise) hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(e=>console.log(e)));
                    } else if (video.canPlayType('application/vnd.apple.mpegurl') && ((server.type && server.type.toLowerCase() === 'hls') || urlStr.endsWith('.m3u8'))) {
                        video.src = finalUrl;
                        if(!playPromise) video.addEventListener('loadedmetadata', () => video.play().catch(e=>console.log(e)));
                    } else {
                        video.src = finalUrl;
                        if(!playPromise) video.play().catch(e=>console.log(e));
                    }
                }
            }

            
            
            window.changeVideoServer = function(index) {
                document.querySelectorAll('.server-btn').forEach(btn => {
                    btn.classList.remove('bg-netflixRed/10', 'text-white', 'border-netflixRed', 'shadow-[0_0_15px_rgba(229,9,20,0.2)]');
                    btn.classList.add('bg-black', 'text-gray-400', 'border-gray-700');
                    const glow = btn.querySelector('.absolute');
                    if (glow) glow.remove();
                });
                const activeBtn = document.getElementById(`server-btn-${index}`);
                if (activeBtn) {
                    activeBtn.classList.remove('bg-black', 'text-gray-400', 'border-gray-700');
                    activeBtn.classList.add('bg-netflixRed/10', 'text-white', 'border-netflixRed', 'shadow-[0_0_15px_rgba(229,9,20,0.2)]');
                    activeBtn.insertAdjacentHTML('beforeend', '<div class="absolute inset-0 bg-gradient-to-br from-netflixRed/20 to-transparent"></div>');
                }

                const wasPlaying = !video.paused;
                loadSource(index);
                if(wasPlaying) video.play().catch(e=>console.log(e));
            };

            // Error Handling
            video.addEventListener('error', (e) => {
                let errorMsg = "An unknown error occurred while trying to play the video.";
                if(video.error && video.error.code === 4) {
                     errorMsg = "The video could not be loaded, either because the server or network failed or because the format is not supported.";
                } else if (video.error && video.error.code === 3) {
                     errorMsg = "The video playback was aborted due to a corruption problem or because the video used features your browser did not support.";
                }
                overlay.style.display = 'flex';
                overlay.innerHTML = `<div class="text-center text-white p-6 max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-lg shadow-2xl backdrop-blur"><i class="fas fa-exclamation-triangle text-4xl mb-4 text-red-500"></i><h3 class="text-xl font-bold mb-2">Playback Error</h3><p class="text-gray-400 text-sm">${errorMsg}</p></div>`;
            });

            loadSource(0);

            playPauseBtn.addEventListener('click', togglePlay);
            if(document.getElementById('big-play-btn')) document.getElementById('big-play-btn').addEventListener('click', togglePlay);
            video.addEventListener('click', togglePlay);

            video.addEventListener('play', () => {
                playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                overlay.style.display = 'none';
            });
            video.addEventListener('pause', () => playPauseBtn.innerHTML = '<i class="fas fa-play"></i>');

            video.addEventListener('timeupdate', () => {
                if(!video.duration) return;
                const pct = (video.currentTime / video.duration) * 100;
                seekBar.value = pct;
                seekProgress.style.width = pct + '%';
                timeCurrent.innerText = formatTime(video.currentTime);
                timeTotal.innerText = formatTime(video.duration);
                
                // --- CONTINUE WATCHING SAVE ---
                if (!window.lastProgressSave || Date.now() - window.lastProgressSave > 5000) {
                    window.lastProgressSave = Date.now();
                    try {
                        let cw = JSON.parse(localStorage.getItem('nexora_continue_watching') || '[]');
                        cw = cw.filter(c => !(c.id === id && c.type === type && (type === 'movie' || (c.season == season && c.episode == episode))));
                        
                        if (pct < 95) {
                            cw.unshift({
                                id, type, season, episode,
                                progress: video.currentTime,
                                duration: video.duration,
                                title: type === 'movie' ? itemDetails.title : `${itemDetails.title} (S${season} E${episode})`,
                                poster: itemDetails.poster,
                                ts: Date.now()
                            });
                            if(cw.length > 20) cw = cw.slice(0, 20);
                            localStorage.setItem('nexora_continue_watching', JSON.stringify(cw));
                        } else {
                            localStorage.setItem('nexora_continue_watching', JSON.stringify(cw)); // Removed if finished
                        }
                    } catch(e) {}
                }
            });

            seekBar.addEventListener('input', () => {
                video.currentTime = (seekBar.value / 100) * video.duration;
            });

            document.getElementById('rewind').addEventListener('click', () => video.currentTime -= 10);
            document.getElementById('forward').addEventListener('click', () => video.currentTime += 10);
            document.getElementById('fullscreen').addEventListener('click', () => {
                if(document.fullscreenElement) document.exitFullscreen();
                else wrapper.requestFullscreen();
            });

            // Hide controls on idle
            let timeout;

            // Restore search state
            if (window.savedSearchState && window.savedSearchState.query) {
                setTimeout(() => {
                    const si = document.getElementById('search-input');
                    if(si) {
                        si.value = window.savedSearchState.query;
                        executeSearch(window.savedSearchState.query).then(() => {
                            if (window.savedSearchState.scrollY > 0) {
                                window.scrollTo(0, window.savedSearchState.scrollY);
                            }
                        });
                    }
                }, 50);
            }

            wrapper.addEventListener('mousemove', () => {
                wrapper.classList.remove('idle');
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    if(!video.paused) wrapper.classList.add('idle');
                }, 3000);
            });
        }

        function formatTime(seconds) {
            if(isNaN(seconds)) return "00:00";
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            if(h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
            return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        }

        // ==========================
        // MY LIST
        // ==========================
        window.clearSearchHistory = function() {
            localStorage.removeItem('nexora_recent_searches');
            renderSearch();
        }

        window.submitRating = async function(id, type, rating) {
            const uid = localStorage.getItem('nexora_user_id') || ('u_' + Date.now() + Math.floor(Math.random()*10000));
            localStorage.setItem('nexora_user_id', uid);
            
            try {
                // Save rating to Realtime DB
                const node = type === 'movie' ? 'movies' : 'tvShows';
                // Wait for the 
                // Wait, firebase is module in index.html? It's loaded as type="module" at the end of index.html.
                // Better yet, just dispatch a custom event and let the module handle it.
                window.dispatchEvent(new CustomEvent('submitRatingEvent', { detail: { id, type, rating, uid } }));
                
                // Update UI instantly
                document.querySelectorAll(`.star-rating-icon-${id}`).forEach((star) => {
                    const val = parseInt(star.getAttribute('data-val'));
                    if (val <= rating) {
                        star.classList.remove('text-gray-600');
                        star.classList.add('text-yellow-500', 'star-pop');
                        star.style.animationDelay = `${(val - 1) * 0.05}s`;
                    } else {
                        star.classList.remove('text-yellow-500', 'star-pop');
                        star.classList.add('text-gray-600');
                        star.style.animationDelay = '0s';
                    }
                });
                
                const thankYou = document.getElementById(`rating-thanks-${id}`);
                if(thankYou) {
                    thankYou.classList.remove('hidden');
                    thankYou.classList.remove('opacity-0');
                    thankYou.classList.add('opacity-100');
                    setTimeout(() => { 
                        thankYou.classList.remove('opacity-100'); 
                        thankYou.classList.add('opacity-0'); 
                    }, 2000);
                }
                
                // Store locally that user rated this to show state
                let userRatings = JSON.parse(localStorage.getItem('nexora_user_ratings') || '{}');
                userRatings[`${node}_${id}`] = rating;
                localStorage.setItem('nexora_user_ratings', JSON.stringify(userRatings));
                
            } catch(e) {
                console.error("Error rating:", e);
            }
        }

        window.toggleMyList = function(id, type) {
            let list = []; try { list = JSON.parse(localStorage.getItem('nexora_mylist') || '[]'); } catch(e) {}
            const exists = list.find(i => i.id === id);
            let isAdded = false;
            
            if(exists) {
                list = list.filter(i => i.id !== id);
            } else {
                list.push({id, type});
                isAdded = true;
            }
            localStorage.setItem('nexora_mylist', JSON.stringify(list));
            
            // Visual feedback on buttons
            document.querySelectorAll('.mylist-btn-' + id).forEach(btn => {
                if (btn.classList.contains('flex-col')) {
                    // Mobile hero style
                    btn.innerHTML = isAdded 
                        ? '<i class="fas fa-check text-green-500 text-xl mb-1"></i><span class="text-[10px] font-semibold text-green-500">My List</span>'
                        : '<i class="fas fa-plus text-xl mb-1"></i><span class="text-[10px] font-semibold">My List</span>';
                } else {
                    // Standard button style
                    btn.innerHTML = isAdded 
                        ? '<i class="fas fa-check text-green-500"></i> In My List'
                        : '<i class="fas fa-plus"></i> My List';
                }
            });
            
            // Visual feedback on buttons
            if (window.updateMyListBadge) window.updateMyListBadge();
        }

        function renderMyList() {
            let list = []; try { list = JSON.parse(localStorage.getItem('nexora_mylist') || '[]'); } catch(e) {}
            appContent.innerHTML = `<div class="pt-24 md:pt-32 px-4 md:px-12 min-h-screen max-w-7xl mx-auto"><h1 class="text-4xl font-bold mb-10 border-l-4 border-netflixRed pl-4">My Favorites</h1><div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" id="mylist-grid">${Array(12).fill('<div class="w-full aspect-[2/3] bg-gray-900/50 animate-pulse rounded"></div>').join('')}</div></div>`;
            
            setTimeout(async () => {
                let html = '';
                for(let item of list) {
                    const data = await fetchFirebaseData(`${item.type === 'movie' ? 'movies' : 'tvShows'}/${item.id}`);
                    if(data) {
                        html += `
                            <a href="#${item.type}/${data.id}" class="relative rounded overflow-hidden card-hover transition-all duration-300 aspect-[2/3] bg-neutral-900 border border-white/5 block">
                                <div class="n-badge"></div>
                                <img src="${data.poster}" loading="lazy" class="w-full h-full object-cover">
                            </a>`;
                    }
                }
                document.getElementById('mylist-grid').innerHTML = html || '<div class="col-span-full text-gray-500 py-20 text-center text-xl flex flex-col items-center gap-4"><i class="fas fa-heart-broken text-4xl"></i> Your list is empty.</div>';
            }, 100);
        }

        window.clearWatchHistory = function() {
            localStorage.removeItem('nexora_continue_watching');
            alert("Watch history cleared.");
            if(window.location.hash === '#home') handleRoute();
        }
        
        // ==========================
        // PROFESSIONAL SEARCH
        // ==========================
        async function renderSearch() {
            appContent.innerHTML = `
            <div id="header-ad-container" class="w-full max-w-7xl mx-auto px-4 pt-20 text-center empty:hidden"></div>
                <div class="pt-6 md:pt-24 px-4 md:px-12 min-h-screen max-w-screen-2xl mx-auto flex flex-col items-center">
                    
                    <!-- Netflix Style Search Bar -->
                    <div class="relative w-full mb-8 group animate-fade-in-up">
                        <div class="flex items-center bg-[#141414] border border-gray-600 focus-within:border-white transition-colors rounded-sm px-4 py-2">
                            <i class="fas fa-search text-2xl text-gray-400 mr-4"></i>
                            <input type="text" id="search-input" placeholder="Titles, people, genres" class="w-full bg-transparent text-white text-xl md:text-2xl outline-none placeholder-gray-500 py-2">
                            <button onclick="document.getElementById('search-input').value=''; executeSearch(''); document.getElementById('search-input').focus();" id="clear-search-btn" class="text-2xl text-gray-400 hover:text-white transition-colors ml-4 hidden"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                    
                    <div class="w-full">
                        <!-- Default view placeholder (Top Searches) -->
                        <div id="search-results" class="w-full">
                            <!-- Loader -->
                            <div class="col-span-full py-10" id="search-skeleton">
                                <!-- Skeleton injected via JS -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('search-skeleton').innerHTML = window.getGridSkeletonHtml();
            executeSearch('');
            
            const input = document.getElementById('search-input');
            let timeout;
            
            input.addEventListener('input', (e) => {
                window.savedSearchState.query = e.target.value;
                clearTimeout(timeout);
                timeout = setTimeout(() => executeSearch(e.target.value), 600);
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const q = e.target.value.trim();
                    if (q.length >= 2) {
                        let rs = [];
                        try { rs = JSON.parse(localStorage.getItem('nexora_recent_searches') || '[]'); } catch(e) {}
                        rs = rs.filter(s => s.toLowerCase() !== q.toLowerCase());
                        rs.unshift(q);
                        if (rs.length > 8) rs.pop();
                        localStorage.setItem('nexora_recent_searches', JSON.stringify(rs));
                    }
                }
            });
            
            input.focus();
        }
        
        async function executeSearch(query) {
            const resultsDiv = document.getElementById('search-results');
            const clearBtn = document.getElementById('clear-search-btn');
            
            if (clearBtn) {
                if (query && query.length > 0) clearBtn.classList.remove('hidden');
                else clearBtn.classList.add('hidden');
            }
            
            const isDefaultView = !query || query.length < 1;
            
            resultsDiv.innerHTML = '<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4 w-full">' + Array(12).fill('<div class="w-full aspect-[2/3] bg-[#141414] animate-pulse rounded-sm"></div>').join('') + '</div>';
            
            try {
                    let html = '';
                    const movies = await fetchFirebaseData('movies') || {};
                    const tvShows = await fetchFirebaseData('tvShows') || {};
                    const allContent = [...Object.values(movies).filter(m=>m).map(m=>({...m, type:'movie'})), ...Object.values(tvShows).filter(m=>m).map(m=>({...m, type:'tv'}))];
                    
                    let displayResults = [];
                    
                    if (isDefaultView) {
                        // Netflix shows "Top Searches" when empty
                        displayResults = allContent.sort((a,b) => (b.top10Rank || 0) - (a.top10Rank || 0)).slice(0, 18);
                        
                        html += `<h2 class="text-xl md:text-2xl font-bold text-gray-400 mb-6 col-span-full">Top Searches</h2>`;
                        html += `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4 w-full">`;
                    } else {
                        displayResults = allContent.filter(c => 
                            c.title.toLowerCase().includes(query.toLowerCase()) || 
                            (c.genres && c.genres.some(g => g.toLowerCase().includes(query.toLowerCase()))) ||
                            (c.cast && (Array.isArray(c.cast) ? c.cast : Object.values(c.cast)).some(actor => actor.name && actor.name.toLowerCase().includes(query.toLowerCase())))
                        );
                        html += `<h2 class="text-xl md:text-2xl font-bold text-gray-400 mb-6 col-span-full">Explore titles related to: <span class="text-white">"${query}"</span></h2>`;
                        html += `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4 w-full">`;
                    }
                    
                    displayResults.forEach(item => {
                        html += `
                            <a href="#${item.type}/${item.id}" class="relative rounded-sm overflow-hidden hover:scale-105 transition-transform duration-300 aspect-[2/3] bg-[#141414] block">
                                ${item.type === 'movie' ? '<div class="n-badge z-10"></div>' : ''}
                                <img src="${item.poster}" loading="lazy" class="w-full h-full object-cover">
                                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                    <h3 class="font-bold text-xs sm:text-sm text-white drop-shadow">${item.title}</h3>
                                </div>
                            </a>
                        `;
                    });
                    html += `</div>`;

                    if (displayResults.length === 0) {
                        resultsDiv.innerHTML = `
                            <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
                                <h2 class="text-xl md:text-2xl text-gray-300 mb-2">Your search for "${query}" did not have any matches.</h2>
                                <p class="text-gray-500 mb-8 max-w-md">Suggestions:<br/>- Try different keywords<br/>- Looking for a movie or TV show?<br/>- Try using a movie, TV show title, an actor or director</p>
                            </div>
                        `;
                    } else {
                        resultsDiv.innerHTML = html;
                    }
            } catch(e) {
                console.error("Search Error:", e);
                resultsDiv.innerHTML = '<div class="col-span-full text-center text-red-500 pt-10 text-xl">Error loading search results.</div>';
            }
        }
        
        window.searchTMDBForRequest = async function(query) {
            const resDiv = document.getElementById('req-tmdb-results');
            if(!query || query.length < 2) { resDiv.classList.add('hidden'); return; }
            
            let key = (window.appSettings && window.appSettings.tmdbKey) ? window.appSettings.tmdbKey.trim() : 
window.TMDB_API_KEY;
            if(!key || key === 'YOUR_TMDB_API_KEY') key = "eaa427dc2d3150ffec741537c8e0de6d";
            
            resDiv.classList.remove('hidden');
            resDiv.innerHTML = '<div class="p-4 text-center text-gray-400"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
            
            try {
                const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${key}&query=${encodeURIComponent(query)}`);
                const data = await res.json();
                
                if(data.results && data.results.length > 0) {
                    let html = '';
                    data.results.forEach(item => {
                        if(item.media_type === 'person') return;
                        const title = item.title || item.name;
                        const year = (item.release_date || item.first_air_date || '').split('-')[0];
                        const type = item.media_type === 'tv' ? 'TV Show' : 'Movie';
                        const poster = item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : 'https://via.placeholder.com/92x138?text=No+Image';
                        
                        html += `
                            <div class="p-2 border-b border-gray-800 hover:bg-gray-800 cursor-pointer flex gap-3 items-center" onclick="selectRequestItem('${title.replace(/'/g, "\\'")}', '${type}', '${year}')">
                                <img src="${poster}" loading="lazy" class="w-10 h-14 object-cover rounded">
                                <div>
                                    <div class="font-bold text-white">${title} <span class="text-gray-500 font-normal">(${year})</span></div>
                                    <div class="text-xs text-gray-400">${type}</div>
                                </div>
                            </div>
                        `;
                    });
                    resDiv.innerHTML = html || '<div class="p-4 text-center text-gray-400">No results found</div>';
                } else {
                    resDiv.innerHTML = '<div class="p-4 text-center text-gray-400">No results found</div>';
                }
            } catch(e) {
                resDiv.innerHTML = '<div class="p-4 text-center text-red-500">Error searching</div>';
            }
        }
        
        window.selectRequestItem = function(title, type, year) {
            document.getElementById('req-title').value = title;
            document.getElementById('req-type').value = type;
            document.getElementById('req-info').value = year ? `Release Year: ${year}` : '';
            document.getElementById('req-tmdb-search').value = title;
            document.getElementById('req-tmdb-results').classList.add('hidden');
        }

        
        // ==========================
        // HOVER VIDEO PREVIEWS
        // ==========================
        let currentHoverTimer = null;
        let currentPreviewEl = null;

        window.startPreview = function(el, type, id) {
            if(currentHoverTimer) clearTimeout(currentHoverTimer);
            
            const wrapper = el.querySelector('.preview-video-wrapper');
            if(!wrapper) return;
            
            currentHoverTimer = setTimeout(async () => {
                currentPreviewEl = wrapper;
                wrapper.classList.remove('hidden');
                wrapper.classList.add('opacity-0');
                wrapper.innerHTML = '<div class="absolute inset-0 flex items-center justify-center bg-neutral-900/80"><i class="fas fa-spinner fa-spin text-white/50 text-2xl"></i></div>';
                setTimeout(() => wrapper.classList.remove('opacity-0'), 50);
                
                try {
                    let title = "";
                    let year = "";
                    if (window.movies && window.movies[id]) {
                        title = window.movies[id].title || window.movies[id].name || "";
                        year = window.movies[id].year || "";
                    } else if (window.tvShows && window.tvShows[id]) {
                        title = window.tvShows[id].title || window.tvShows[id].name || "";
                        year = window.tvShows[id].year || "";
                    }
                    if (!title) {
                        const h3 = el.querySelector('h3');
                        if(h3) title = h3.innerText;
                    }
                    if (!title) return;
let key = (window.appSettings && window.appSettings.tmdbKey) ? window.appSettings.tmdbKey.trim() : window.TMDB_API_KEY;
                    if(!key || key === 'YOUR_TMDB_API_KEY') key = "eaa427dc2d3150ffec741537c8e0de6d";
                    
                    let searchUrl = `https://api.themoviedb.org/3/search/${type}?api_key=${key}&query=${encodeURIComponent(title)}`;
                    if(year && year !== 'undefined' && year.length === 4) searchUrl += `&year=${year}`;
                    
                    const searchRes = await fetch(searchUrl);
                    const searchData = await searchRes.json();
                    
                    if (searchData.results && searchData.results.length > 0) {
                        const tmdbId = searchData.results[0].id;
                        const videoUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}/videos?api_key=${key}`;
                        const videoRes = await fetch(videoUrl);
                        const videoData = await videoRes.json();
                        
                        if (videoData.results && videoData.results.length > 0) {
                            const trailer = videoData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videoData.results.find(v => v.type === 'Teaser' && v.site === 'YouTube') || videoData.results[0];
                            if (trailer && trailer.site === 'YouTube') {
                                if (currentPreviewEl !== wrapper) return; // User moved away
                                
                                wrapper.innerHTML = `
                                    <div class="absolute inset-0 bg-black">
                                        <iframe class="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 object-cover opacity-80" 
                                        src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&modestbranding=1&showinfo=0&rel=0&loop=1&playlist=${trailer.key}&start=5" 
                                        frameborder="0" allow="autoplay; encrypted-media"></iframe>
                                    </div>
                                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                                `;
                                return;
                            }
                        }
                    }
                } catch(e) {
                    console.warn('Preview fetch error skipped');
                }
                
                // If we reach here, no video found
                if (currentPreviewEl === wrapper) {
                    wrapper.innerHTML = '';
                    wrapper.classList.add('opacity-0');
                    setTimeout(() => wrapper.classList.add('hidden'), 300);
                }
            }, 800); // 800ms hover delay
        }

        window.stopPreview = function(el) {
            if(currentHoverTimer) {
                clearTimeout(currentHoverTimer);
                currentHoverTimer = null;
            }
            const wrapper = el.querySelector('.preview-video-wrapper');
            if(wrapper) {
                wrapper.classList.add('opacity-0');
                setTimeout(() => {
                    if (wrapper.classList.contains('opacity-0')) {
                        wrapper.classList.add('hidden');
                        wrapper.innerHTML = '';
                    }
                }, 300);
            }
            if (currentPreviewEl === wrapper) currentPreviewEl = null;
        }

        // ==========================
        // TRAILER MODAL
        // ==========================
        window.shareContent = function(btn) {
            const url = window.location.href;
            navigator.clipboard.writeText(url).then(() => {
                const originalHtml = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check text-green-500"></i> Copied!';
                btn.classList.add('border-green-500', 'text-green-500', 'animate-pop');
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                    btn.classList.remove('border-green-500', 'text-green-500', 'animate-pop');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
                alert('Failed to copy URL.');
            });
        };

        window.openTrailerModal = async function(title, type, year) {
            const modal = document.getElementById('trailer-modal');
            const container = document.getElementById('trailer-container');
            const content = document.getElementById('trailer-modal-content');
            
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                content.classList.remove('scale-95');
                content.classList.add('scale-100');
            }, 10);
            
            container.innerHTML = '<div class="flex flex-col items-center"><div class="w-12 h-12 border-4 border-netflixRed border-t-transparent rounded-full animate-spin mb-4"></div><p class="text-white font-bold tracking-widest">LOCATING SIGNAL...</p></div>';

            try {
                let key = (window.appSettings && window.appSettings.tmdbKey) ? window.appSettings.tmdbKey.trim() : 
window.TMDB_API_KEY;
                if(!key || key === 'YOUR_TMDB_API_KEY') key = "eaa427dc2d3150ffec741537c8e0de6d";

                const searchUrl = `https://api.themoviedb.org/3/search/${type}?api_key=${key}&query=${encodeURIComponent(title)}&year=${year}`;
                const searchRes = await fetch(searchUrl);
                const searchData = await searchRes.json();
                
                if (searchData.results && searchData.results.length > 0) {
                    const id = searchData.results[0].id;
                    const videoUrl = `https://api.themoviedb.org/3/${type}/${id}/videos?api_key=${key}`;
                    const videoRes = await fetch(videoUrl);
                    const videoData = await videoRes.json();
                    
                    if (videoData.results && videoData.results.length > 0) {
                        const trailer = videoData.results.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videoData.results[0];
                        // Auto-play the trailer, but browsers block unmuted autoplay.
                        // We will play it muted, and inject a custom volume toggle over it (or let YouTube handle it with native controls).
                        // Since YouTube's iframe doesn't let us easily toggle volume externally without the IFrame API,
                        // we'll use the YouTube IFrame Player API.
                        
                        container.innerHTML = `<div id="yt-player-container" class="w-full h-full relative">
                            <div id="yt-player"></div>
                            <button id="custom-mute-btn" onclick="toggleTrailerMute()" class="absolute bottom-6 right-6 bg-black/60 hover:bg-black/90 text-white w-12 h-12 rounded-full flex items-center justify-center transition backdrop-blur border border-white/20 z-50 shadow-2xl">
                                <i class="fas fa-volume-mute text-xl"></i>
                            </button>
                        </div>`;
                        
                        // Load YT API if not present
                        if(!window.YT) {
                            const tag = document.createElement('script');
                            tag.src = "https://www.youtube.com/iframe_api";
                            const firstScriptTag = document.getElementsByTagName('script')[0];
                            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
                        }
                        
                        window.onYouTubeIframeAPIReady = function() {
                            createPlayer(trailer.key);
                        };
                        
                        if(window.YT && window.YT.Player) {
                            createPlayer(trailer.key);
                        }
                        
                        function createPlayer(videoId) {
                            window.trailerPlayer = new YT.Player('yt-player', {
                                height: '100%',
                                width: '100%',
                                videoId: videoId,
                                playerVars: {
                                    'autoplay': 1,
                                    'controls': 1,
                                    'mute': 1, // Start muted to guarantee autoplay
                                    'rel': 0,
                                    'modestbranding': 1
                                },
                                events: {
                                    'onReady': onPlayerReady
                                }
                            });
                        }
                        
                        function onPlayerReady(event) {
                            event.target.playVideo();
                            // If we can play unmuted, try it (browsers usually block it, but good to try)
                            // event.target.unMute();
                        }

                    } else {
                        container.innerHTML = '<div class="text-white text-xl">No trailer available for this title.</div>';
                    }
                } else {
                    container.innerHTML = '<div class="text-white text-xl">Title not found in database.</div>';
                }
            } catch (error) {
                container.innerHTML = '<div class="text-white text-xl text-red-500">Error loading trailer.</div>';
            }
        }

        window.toggleTrailerMute = function() {
            if(window.trailerPlayer && window.trailerPlayer.isMuted) {
                const isMuted = window.trailerPlayer.isMuted();
                const btn = document.getElementById('custom-mute-btn');
                if(isMuted) {
                    window.trailerPlayer.unMute();
                    window.trailerPlayer.setVolume(100);
                    btn.innerHTML = '<i class="fas fa-volume-up text-xl"></i>';
                } else {
                    window.trailerPlayer.mute();
                    btn.innerHTML = '<i class="fas fa-volume-mute text-xl"></i>';
                }
            }
        }

        // ==========================
        // PROFILE PAGE
        // ==========================
        function renderRewards() {
    let cwList = [];
    try { cwList = JSON.parse(localStorage.getItem('nexora_cw') || '[]'); } catch(e){}
    let ratings = {};
    try { ratings = JSON.parse(localStorage.getItem('nexora_user_ratings') || '{}'); } catch(e){}
    const watchCount = cwList.length;
    const ratingCount = Object.keys(ratings).length;
    const totalPoints = (watchCount * 50) + (ratingCount * 20);
    const achievements = [
        { id: 'first_stream', name: 'First Stream', desc: 'Watch your first movie or show.', icon: 'fa-play', earned: watchCount > 0 },
        { id: 'critic', name: 'Critic', desc: 'Rate a movie or show.', icon: 'fa-star', earned: ratingCount > 0 },
        { id: 'binge', name: 'Binge Watcher', desc: 'Watch 5 items.', icon: 'fa-couch', earned: watchCount >= 5 },
        { id: 'top_critic', name: 'Top Critic', desc: 'Rate 5 items.', icon: 'fa-trophy', earned: ratingCount >= 5 },
        { id: 'movie_buff', name: 'Movie Buff', desc: 'Watch 10 items.', icon: 'fa-film', earned: watchCount >= 10 }
    ];
    let badgesHtml = achievements.map(a => '<div class="bg-gray-900 border ' + (a.earned ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:scale-105' : 'border-gray-800 opacity-50 grayscale') + ' rounded-xl p-4 md:p-6 flex flex-col items-center text-center relative overflow-hidden transition-all duration-300">' +         (a.earned ? '<div class="absolute -top-6 -right-6 w-12 h-12 bg-yellow-500 rotate-45"></div>' : '') +        '<div class="w-16 h-16 rounded-full ' + (a.earned ? 'bg-yellow-500/20 text-yellow-500' : 'bg-gray-800 text-gray-500') + ' flex items-center justify-center text-2xl mb-4"><i class="fas ' + a.icon + '"></i></div>' +        '<h3 class="font-bold text-white mb-2">' + a.name + '</h3>' +        '<p class="text-xs text-gray-400">' + a.desc + '</p></div>'
    ).join('');
    appContent.innerHTML = '<div class="pt-24 md:pt-32 px-4 md:px-12 min-h-screen max-w-5xl mx-auto animate-fade-in-up pb-16">' +        '<div class="text-center mb-12">' +            '<h1 class="text-4xl md:text-5xl font-bold mb-4 font-sans tracking-tight"><span class="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Rewards & Achievements</span></h1>' +            '<p class="text-gray-400 max-w-2xl mx-auto">Earn points and badges by watching and rating your favorite movies and TV shows.</p>' +        '</div>' +        '<div class="bg-gradient-to-br from-gray-900 to-black border border-white/5 rounded-2xl p-8 mb-12 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">' +            '<div class="absolute top-0 right-0 w-64 h-64 bg-yellow-500 opacity-5 rounded-full blur-[80px]"></div>' +            '<div class="flex items-center gap-6 z-10 mb-6 md:mb-0">' +                '<div class="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/20"><i class="fas fa-coins text-4xl text-yellow-500"></i></div>' +                '<div><p class="text-sm text-gray-400 font-bold uppercase tracking-widest mb-1">Total Balance</p><p class="text-5xl font-black text-white">' + totalPoints + '</p></div>' +            '</div>' +            '<div class="flex gap-4 z-10 text-center">' +                '<div class="bg-black/80 p-4 rounded-lg border border-white/5"><p class="text-2xl font-bold text-white mb-1">' + watchCount + '</p><p class="text-xs text-gray-400">Streams (+50/ea)</p></div>' +                '<div class="bg-black/80 p-4 rounded-lg border border-white/5"><p class="text-2xl font-bold text-white mb-1">' + ratingCount + '</p><p class="text-xs text-gray-400">Ratings (+20/ea)</p></div>' +            '</div>' +        '</div>' +        '<div class="mb-12"><h2 class="text-2xl font-bold mb-6 flex items-center gap-2"><i class="fas fa-medal text-yellow-500"></i> Your Badges</h2><div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">' + badgesHtml + '</div></div>' +        '<div class="bg-black/40 border border-white/5 rounded-xl p-6 md:p-8">' +            '<h3 class="text-xl font-bold mb-4">How to earn points?</h3>' +            '<ul class="space-y-3 text-gray-400 text-sm">' +                '<li class="flex items-center gap-3"><i class="fas fa-play-circle text-netflixRed"></i> Watch a Movie or TV Show Episode (50 pts)</li>' +                '<li class="flex items-center gap-3"><i class="fas fa-star text-yellow-500"></i> Leave a Star Rating (20 pts)</li>' +            '</ul>' +        '</div>' +    '</div>';
}

        function renderRequest() { appContent.innerHTML = '<div class="pt-24 md:pt-32 px-4 md:px-12 min-h-screen max-w-3xl mx-auto animate-fade-in-up">' + '<h1 class="text-3xl md:text-4xl font-bold mb-6 border-b border-gray-800 pb-4 text-center md:text-left">Request Content</h1>' + '<p class="text-gray-400 mb-8 text-center md:text-left">Can\'t find your favorite movie or TV show? Request it here and our team will try to add it.</p>' + '<form id="request-form" onsubmit="submitRequest(event)" class="bg-black/40 p-6 md:p-8 rounded-xl border border-white/5 backdrop-blur-sm space-y-6">' +     '<div><label class="block text-gray-400 font-bold mb-2 text-sm">Your Name</label>' +     '<input type="text" id="req-name" required class="w-full bg-black/60 border border-gray-700 p-3 rounded text-white focus:border-netflixRed outline-none transition-colors"></div>' +     '<div><label class="block text-gray-400 font-bold mb-2 text-sm">Content Type</label>' +     '<select id="req-type" class="w-full bg-black/60 border border-gray-700 p-3 rounded text-white focus:border-netflixRed outline-none appearance-none transition-colors">' +         '<option value="Movie">Movie</option><option value="TV Show">TV Show</option><option value="Other">Other</option>' +     '</select></div>' +     '<div><label class="block text-gray-400 font-bold mb-2 text-sm">Title</label>' +     '<input type="text" id="req-title" required class="w-full bg-black/60 border border-gray-700 p-3 rounded text-white focus:border-netflixRed outline-none transition-colors" placeholder="e.g. Inception"></div>' +     '<div><label class="block text-gray-400 font-bold mb-2 text-sm">Year / Additional Details (Optional)</label>' +     '<textarea id="req-details" rows="3" class="w-full bg-black/60 border border-gray-700 p-3 rounded text-white focus:border-netflixRed outline-none transition-colors"></textarea></div>' +     '<button type="submit" id="req-submit-btn" class="w-full bg-netflixRed hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors shadow-lg">Submit Request</button>' +     '<div id="req-success" class="hidden bg-green-900/50 border border-green-500 text-green-200 p-4 rounded text-center mt-4">Your request has been submitted successfully!</div>' + '</form></div>';}
window.submitRequest = function(e) {
    e.preventDefault();
    const btn = document.getElementById('req-submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    const name = document.getElementById('req-name').value;
    const type = document.getElementById('req-type').value;
    const title = document.getElementById('req-title').value;
    const details = document.getElementById('req-details').value;
    window.dispatchEvent(new CustomEvent('submitRequestEvent', { 
        detail: { name, type, title, details, timestamp: Date.now() } 
    }));
    setTimeout(() => {
        document.getElementById('req-success').classList.remove('hidden');
        document.getElementById('request-form').reset();
        btn.disabled = false;
        btn.innerHTML = 'Submit Request';
        setTimeout(() => {
            document.getElementById('req-success').classList.add('hidden');
        }, 5000);
    }, 1000);
};

        function renderProfile() {
            appContent.innerHTML = `
                <div class="pt-24 md:pt-32 px-4 md:px-12 min-h-screen max-w-4xl mx-auto animate-fade-in-up">
                    <h1 class="text-3xl md:text-5xl font-bold mb-10 border-b border-gray-800 pb-4">Account Overview</h1>
                    <div class="flex flex-col md:flex-row gap-10 items-start">
                        <!-- Left Side / Avatar -->
                        <div class="w-full md:w-1/3 flex flex-col items-center">
                            <div class="w-48 h-48 rounded-md overflow-hidden bg-gray-900 border-4 border-gray-800 mb-6 shadow-2xl relative group cursor-pointer">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png" class="w-full h-full object-cover">
                                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                                    <i class="fas fa-camera text-3xl text-white"></i>
                                </div>
                            </div>
                            <h2 class="text-2xl font-bold">User</h2>
                            <p class="text-gray-400 mb-6">user@nexflix.com</p>
                            <button class="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded transition mb-3">Manage Profiles</button>
                            <a href="#rewards" class="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black text-center font-bold py-3 px-4 rounded transition shadow-lg block shadow-yellow-500/20"><i class="fas fa-gift mr-2"></i> Rewards & Badges</a>
                        </div>
                        
                        <!-- Right Side / Settings -->
                        <div class="w-full md:w-2/3">
                            <div class="bg-[#151515] rounded-xl border border-gray-800 p-6 mb-6 shadow-lg">
                                <h3 class="text-xl font-bold mb-4 text-gray-300">Plan Details</h3>
                                <div class="flex justify-between items-center mb-4">
                                    <div>
                                        <p class="text-lg font-bold">Premium Ultra HD</p>
                                        <p class="text-sm text-gray-500">4K + HDR</p>
                                    </div>
                                    <i class="fas fa-crown text-netflixRed text-2xl"></i>
                                </div>
                                <hr class="border-gray-800 my-4">
                                <button class="text-blue-500 hover:underline text-sm">Change Plan</button>
                            </div>
                            
                            <div class="bg-[#151515] rounded-xl border border-gray-800 p-6 shadow-lg">
                                <h3 class="text-xl font-bold mb-4 text-gray-300">Settings</h3>
                                <div class="space-y-4">
                                    <div class="flex justify-between items-center py-2 border-b border-gray-800">
                                        <span class="text-gray-400">Parental Controls</span>
                                        <span class="text-gray-600">Off <i class="fas fa-chevron-right ml-2 text-xs"></i></span>
                                    </div>
                                    <div class="flex justify-between items-center py-2 border-b border-gray-800">
                                        <span class="text-gray-400">Language</span>
                                        <span class="text-gray-300">English <i class="fas fa-chevron-right ml-2 text-xs text-gray-600"></i></span>
                                    </div>
                                    <div class="flex justify-between items-center py-2 border-b border-gray-800">
                                        <span class="text-gray-400">Playback Settings</span>
                                        <span class="text-gray-600">Auto <i class="fas fa-chevron-right ml-2 text-xs"></i></span>
                                    </div>
                                    <button onclick="showUserLogin()" class="w-full flex justify-between items-center py-2 cursor-pointer hover:bg-gray-800 -mx-4 px-4 transition rounded text-netflixRed font-bold text-left">
                                        <span><i class="fas fa-sign-in-alt mr-2"></i> Sign In to Sync Data</span>
                                    </button>
                                    <div class="flex justify-between items-center py-2 cursor-pointer hover:bg-gray-800 -mx-4 px-4 transition rounded mt-2">
                                        <span class="text-gray-500 font-bold">Sign Out of all devices</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        window.closeTrailerModal = function() {
            const modal = document.getElementById('trailer-modal');
            const container = document.getElementById('trailer-container');
            const content = document.getElementById('trailer-modal-content');
            
            modal.classList.add('opacity-0');
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
            
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.style.display = 'none';
                container.innerHTML = ''; // Stop video
                if(window.trailerPlayer) {
                    window.trailerPlayer.destroy();
                    window.trailerPlayer = null;
                }
            }, 300);
        }

        // Initialize
        initApp();
    