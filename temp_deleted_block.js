            
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

            
