const fs = require('fs');

let index = fs.readFileSync('index.html', 'utf8');

// 1. Add window.sortStreamingServers function before renderPlayer
const sortServersCode = `
        // ==========================
        // STREAMING SERVERS SERIAL SORTER
        // ==========================
        window.sortStreamingServers = function(srvList) {
            if (!srvList) return [];
            let list = Array.isArray(srvList) ? [...srvList] : Object.values(srvList);
            list = list.filter(s => s && s.enabled !== false && s.url);
            
            list.sort((a, b) => {
                const getPriority = (item) => {
                    if (!item) return 999;
                    const name = (item.name || '').toLowerCase();
                    const url = (item.url || '').toLowerCase();
                    
                    if (url.includes('vidout.pages.dev') || name.includes('vidout')) return 1;
                    
                    const numMatch = name.match(/(?:server|srv|source|mirror)?\\s*#?\\s*(\\d+)/i);
                    if (numMatch) return parseInt(numMatch[1]);
                    
                    if (url.includes('autoembed') || name.includes('autoembed')) return 2;
                    if (url.includes('vidsrc') || name.includes('vidsrc')) return 3;
                    if (url.includes('vidlink') || name.includes('vidlink')) return 4;
                    if (url.includes('2embed') || name.includes('2embed')) return 5;
                    return 100;
                };

                const pA = getPriority(a);
                const pB = getPriority(b);
                if (pA !== pB) return pA - pB;
                return (a.name || '').localeCompare(b.name || '');
            });

            return list;
        };
`;

if (!index.includes('window.sortStreamingServers =')) {
  index = index.replace('function renderPlayer(type, id, season, episode) {', sortServersCode + '\n        function renderPlayer(type, id, season, episode) {');
  console.log('Inserted window.sortStreamingServers.');
}

// 2. In renderPlayer, use window.sortStreamingServers
const oldMovieServersLoad = `if(data && data.servers) {
                    servers = Array.isArray(data.servers) ? data.servers : Object.values(data.servers);
                    servers = servers.filter(s => s && s.enabled !== false && s.url);
                }`;

const newMovieServersLoad = `if(data && data.servers) {
                    servers = window.sortStreamingServers(data.servers);
                }`;

if (index.includes(oldMovieServersLoad)) {
  index = index.replace(oldMovieServersLoad, newMovieServersLoad);
  console.log('Updated movie servers loading in renderPlayer.');
} else {
  // Try flexible regex
  index = index.replace(/if\(data\s*&&\s*data\.servers\)\s*\{[\s\S]*?servers\s*=\s*servers\.filter[\s\S]*?\}/, newMovieServersLoad);
  console.log('Updated movie servers loading via regex.');
}

const oldTVEpServersLoad = `if (epData.servers) {
                                servers = Array.isArray(epData.servers) ? epData.servers : Object.values(epData.servers);
                                servers = servers.filter(s => s && s.enabled !== false && s.url);
                            }`;

const newTVEpServersLoad = `if (epData.servers) {
                                servers = window.sortStreamingServers(epData.servers);
                            }`;

if (index.includes(oldTVEpServersLoad)) {
  index = index.replace(oldTVEpServersLoad, newTVEpServersLoad);
  console.log('Updated TV episode servers loading in renderPlayer.');
} else {
  index = index.replace(/if\s*\(epData\.servers\)\s*\{[\s\S]*?servers\s*=\s*servers\.filter[\s\S]*?\}/, newTVEpServersLoad);
  console.log('Updated TV episode servers loading via regex.');
}

// 3. Live TV visibility function
const applyLiveTvStateCode = `
        window.applyLiveTvState = function(isEnabled) {
            window.isLiveTvEnabled = isEnabled;
            document.querySelectorAll('a[href="#livetv"], a[href^="#livetv/"], [data-nav="livetv"], .livetv-nav-item').forEach(el => {
                if (!isEnabled) {
                    el.style.display = 'none';
                    el.classList.add('hidden');
                } else {
                    el.style.display = '';
                    el.classList.remove('hidden');
                }
            });
            const liveRow = document.querySelector('[data-row="livetv"]');
            if (liveRow) {
                liveRow.style.display = isEnabled ? '' : 'none';
            }
            const hash = window.location.hash || '';
            if (!isEnabled && (hash === '#livetv' || hash.startsWith('#livetv/') || hash === '#live')) {
                window.location.hash = '#home';
            }
        };
`;

if (!index.includes('window.applyLiveTvState =')) {
  index = index.replace('window.generateLiveTvRow = function', applyLiveTvStateCode + '\n        window.generateLiveTvRow = function');
  console.log('Inserted window.applyLiveTvState.');
}

// 4. Update window.generateLiveTvRow to check isLiveTvEnabled
const oldGenRowStart = `window.generateLiveTvRow = function(title = 'Live TV • 24/7 Channels', viewAllHash = '#livetv') {`;
const newGenRowStart = `window.generateLiveTvRow = function(title = 'Live TV • 24/7 Channels', viewAllHash = '#livetv') {
            if (window.isLiveTvEnabled === false) return '';`;

if (index.includes(oldGenRowStart) && !index.includes('if (window.isLiveTvEnabled === false) return \'\';')) {
  index = index.replace(oldGenRowStart, newGenRowStart);
  console.log('Updated window.generateLiveTvRow check.');
}

// 5. Update renderHome Live TV check
const oldHomeLiveTv = `if (typeof window.generateLiveTvRow === 'function') {
                html += window.generateLiveTvRow('24/7 Live TV Channels', '#livetv');
            }`;

const newHomeLiveTv = `if (window.isLiveTvEnabled !== false && typeof window.generateLiveTvRow === 'function') {
                const liveTvHtml = window.generateLiveTvRow('24/7 Live TV Channels', '#livetv');
                if (liveTvHtml) html += liveTvHtml;
            }`;

if (index.includes(oldHomeLiveTv)) {
  index = index.replace(oldHomeLiveTv, newHomeLiveTv);
  console.log('Updated renderHome Live TV check.');
}

// 6. Update initApp Live TV listener to onValue
const oldInitLiveTv = `// Live TV On/Off check
                        const isLiveEnabled = (b.enableLiveTV !== false) && (b.liveTvEnabled !== false);
                        window.isLiveTvEnabled = isLiveEnabled;
                        document.querySelectorAll('a[href="#livetv"], a[href^="#livetv/"]').forEach(el => {
                            if (!isLiveEnabled) el.classList.add('hidden');
                            else el.classList.remove('hidden');
                        });
                        if (!isLiveEnabled && (window.location.hash === '#livetv' || window.location.hash.startsWith('#livetv/'))) {
                            window.location.hash = '#home';
                        }`;

const newInitLiveTv = `// Live TV On/Off check
                        const isLiveEnabled = (b.enableLiveTV !== false) && (b.liveTvEnabled !== false);
                        if (typeof window.applyLiveTvState === 'function') {
                            window.applyLiveTvState(isLiveEnabled);
                        } else {
                            window.isLiveTvEnabled = isLiveEnabled;
                            document.querySelectorAll('a[href="#livetv"], a[href^="#livetv/"]').forEach(el => {
                                if (!isLiveEnabled) { el.style.display = 'none'; el.classList.add('hidden'); }
                                else { el.style.display = ''; el.classList.remove('hidden'); }
                            });
                        }`;

if (index.includes(oldInitLiveTv)) {
  index = index.replace(oldInitLiveTv, newInitLiveTv);
  console.log('Updated initApp Live TV check.');
}

fs.writeFileSync('index.html', index, 'utf8');
console.log('Saved index.html updates.');
