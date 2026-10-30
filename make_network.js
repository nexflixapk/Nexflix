const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const networkLogic = `
        async function renderNetwork(networkName) {
            const movies = await fetchFirebaseData('movies') || {};
            const tvShows = await fetchFirebaseData('tvShows') || {};
            
            // Map type correctly
            Object.keys(movies).forEach(k => movies[k].type = 'movie');
            Object.keys(tvShows).forEach(k => tvShows[k].type = 'tv');
            
            let items = [
                ...Object.values(movies).filter(m => m && m.status !== 'draft' && !m.adult),
                ...Object.values(tvShows).filter(t => t && t.status !== 'draft' && !t.adult)
            ];

            // Strict Filter
            const searchTerms = networkName.toLowerCase().split(' ').filter(t=>t.length>0);
            items = items.filter(c => {
                const networkMatch = c.networks && (Array.isArray(c.networks) ? c.networks : Object.values(c.networks)).some(n => n && n.name && searchTerms.some(term => n.name.toLowerCase().includes(term)));
                const studioMatch = c.production_companies && (Array.isArray(c.production_companies) ? c.production_companies : Object.values(c.production_companies)).some(n => n && n.name && searchTerms.some(term => n.name.toLowerCase().includes(term)));
                const fallbackMatch = [c.network, c.studio, c.provider].filter(Boolean).some(val => typeof val === 'string' && searchTerms.some(term => val.toLowerCase().includes(term)));
                const fallbackTagMatch = (c.tags || []).some(t => searchTerms.some(term => t.toLowerCase().includes(term)));
                return networkMatch || studioMatch || fallbackMatch || fallbackTagMatch;
            });
            
            window.currentCategoryItems = items;
            
            let html = \`<div class="min-h-screen bg-[#141414] pt-24 pb-12 animate-fade-in">
                <div class="max-w-7xl mx-auto px-4 md:px-12 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 class="text-3xl md:text-5xl font-black text-white drop-shadow-lg tracking-tight">\${networkName}</h2>
                        <p class="text-gray-400 mt-2 text-sm md:text-base font-medium">Explore all movies and TV shows from \${networkName}</p>
                    </div>
                </div>
                <div class="max-w-7xl mx-auto px-4 md:px-12">
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-4" id="network-grid">
                    \`;
            
            if (items.length > 0) {
                const gridHtml = window.generateItemsGridHtml ? window.generateItemsGridHtml(items) : '';
                // Since generateItemsGridHtml might wrap in another div, we can just use the items loop
                items.forEach((item) => {
                    html += \`
                        <a href="#\${item.type}/\${item.id}" class="relative rounded-sm overflow-hidden hover:scale-105 transition-transform duration-300 aspect-[2/3] bg-[#141414] block group">
                            \${item.type === 'movie' ? '<div class="n-badge z-10"></div>' : ''}
                            \${item.poster ? \`<img src="\${item.poster}" loading="lazy" class="w-full h-full object-cover">\` : \`<div class="w-full h-full bg-gray-900 flex items-center justify-center"><i class="fas fa-image text-4xl text-gray-700"></i></div>\`}
                            <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                <h3 class="font-bold text-xs sm:text-sm text-white drop-shadow">\${item.title || item.name}</h3>
                            </div>
                        </a>
                    \`;
                });
            } else {
                html += \`<div class="col-span-full py-20 text-center bg-[#1a1a1a] rounded-xl border border-gray-800">
                    <i class="fas fa-film text-4xl text-gray-600 mb-4"></i>
                    <p class="text-gray-400 text-lg">No content found for \${networkName} yet.</p>
                </div>\`;
            }

            html += \`</div></div></div>\`;
            document.getElementById('app-content').innerHTML = html;
            window.scrollTo(0,0);
        }
`;

code = code.replace(`async function renderCategory(categoryType) {`, networkLogic + '\n        async function renderCategory(categoryType) {');

const routerTarget = `else if (hash === '#adult') renderCategory('adult');`;
const routerReplacement = `else if (hash === '#adult') renderCategory('adult');
            else if (hash.startsWith('#network/')) renderNetwork(decodeURIComponent(hash.split('/')[1]));`;

code = code.replace(routerTarget, routerReplacement);

// Fix the home buttons
code = code.replace(/onclick="window\.savedSearchState\.query='([^']+)'; window\.location\.hash='#search';"/g, "onclick=\"window.location.hash='#network/$1';\"");


fs.writeFileSync('index.html', code);

