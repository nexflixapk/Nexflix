const fs = require('fs');

let tempDeleted = fs.readFileSync('temp_deleted_block.js', 'utf8');
let newDetails = fs.readFileSync('new_details_html.txt', 'utf8');

// 1. Replace the renderDetails HTML block in tempDeleted with newDetails
const renderDetailsStart = `            appContent.innerHTML = \`
                <!-- Professional Back Button -->`;
const startIndex = tempDeleted.indexOf(renderDetailsStart);
if (startIndex !== -1) {
    tempDeleted = tempDeleted.substring(0, startIndex) + newDetails;
} else {
    console.log("Could not find renderDetailsStart in temp_deleted_block.js");
}

// 2. Re-apply make_network.js changes to tempDeleted
const networkLogic = `        async function renderNetwork(networkName) {
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
                            \${item.poster ? \\\`<img src="\${item.poster}" loading="lazy" class="w-full h-full object-cover">\\\` : \\\`<div class="w-full h-full bg-gray-900 flex items-center justify-center"><i class="fas fa-image text-4xl text-gray-700"></i></div>\\\`}
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
        }`;

tempDeleted = tempDeleted.replace("async function renderCategory(categoryType) {", networkLogic + '\n        async function renderCategory(categoryType) {');

// 3. Re-apply patch_index_networks.js to tempDeleted
const dynamicBrowse = `
            // 0. Browse by Network
            const networksData = await fetchFirebaseData('networks') || {};
            const networksArray = Object.values(networksData);
            
            html += \`
                <div class="mt-8 px-4 md:px-12 relative z-30 animate-fade-in-up">
                    <h2 class="text-xl md:text-2xl font-bold mb-4">Browse by Network</h2>
                    <div class="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4 pb-4">
            \`;
            
            if (networksArray.length > 0) {
                networksArray.forEach(n => {
                    html += \`
                        <button onclick="window.location.hash='#network/\${encodeURIComponent(n.name)}';" class="relative rounded-xl overflow-hidden aspect-video bg-[#141414] border border-gray-700 hover:border-white transition-all shadow-lg hover:scale-105 group flex items-center justify-center">
                            \${n.logo ? \\\`<img src="\${n.logo}" class="\${n.logo.includes('HBO')?'filter invert':''} w-2/3 h-auto object-contain opacity-70 group-hover:opacity-100 transition-opacity">\\\` : \\\`<span class="text-white font-bold opacity-70 group-hover:opacity-100">\${n.name}</span>\\\`}
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                    \`;
                });
            } else {
                html += \`
                        <button onclick="window.location.hash='#network/Netflix';" class="relative rounded-xl overflow-hidden aspect-video bg-[#141414] border border-gray-700 hover:border-white transition-all shadow-lg hover:scale-105 group flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" class="w-2/3 h-auto opacity-70 group-hover:opacity-100 transition-opacity">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                        <button onclick="window.location.hash='#network/Amazon Prime';" class="relative rounded-xl overflow-hidden aspect-video bg-[#141414] border border-gray-700 hover:border-white transition-all shadow-lg hover:scale-105 group flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f1/Prime_Video.png" class="w-2/3 h-auto opacity-70 group-hover:opacity-100 transition-opacity">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                        <button onclick="window.location.hash='#network/Disney';" class="relative rounded-xl overflow-hidden aspect-video bg-[#141414] border border-gray-700 hover:border-white transition-all shadow-lg hover:scale-105 group flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg" class="w-2/3 h-auto opacity-70 group-hover:opacity-100 transition-opacity">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                        <button onclick="window.location.hash='#network/HBO';" class="relative rounded-xl overflow-hidden aspect-video bg-[#141414] border border-gray-700 hover:border-white transition-all shadow-lg hover:scale-105 group flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg" class="w-2/3 h-auto opacity-70 group-hover:opacity-100 transition-opacity filter invert">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                        <button onclick="window.location.hash='#network/Apple TV';" class="relative rounded-xl overflow-hidden aspect-video bg-[#141414] border border-gray-700 hover:border-white transition-all shadow-lg hover:scale-105 group flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/28/Apple_TV_Plus_Logo.svg" class="w-2/3 h-auto opacity-70 group-hover:opacity-100 transition-opacity">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                        <button onclick="window.location.hash='#network/Hulu';" class="relative rounded-xl overflow-hidden aspect-video bg-[#141414] border border-gray-700 hover:border-white transition-all shadow-lg hover:scale-105 group flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Hulu_Logo.svg" class="w-2/3 h-auto opacity-70 group-hover:opacity-100 transition-opacity">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                \`;
            }
            html += \`</div></div>\`;
`;

tempDeleted = tempDeleted.replace(/\/\/ 1\. Trending Now/, dynamicBrowse + '\n            // 1. Trending Now');

// 4. Finally, insert tempDeleted back into index.html
let indexHtml = fs.readFileSync('index.html', 'utf8');

const badBlockStartRegex = /appContent\.innerHTML = `\s*<!-- Professional Back Button -->/;
const match = indexHtml.match(badBlockStartRegex);
if (match) {
    const badStart = match.index;
    const badEnd = indexHtml.indexOf('// Countdown Timer Logic', badStart);
    if (badEnd !== -1) {
        const before = indexHtml.substring(0, badStart);
        const after = indexHtml.substring(badEnd);
        
        const finalHtml = before + tempDeleted + '\n            ' + after;
        fs.writeFileSync('index.html', finalHtml);
        console.log("Success! index.html restored and patched.");
    } else {
        console.log("Could not find badEnd in index.html");
    }
} else {
    console.log("Could not find badStart in index.html");
}

