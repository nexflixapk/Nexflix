const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetLogic = `                            const descMatch = (c.description || c.overview || '') && searchTerms.some(term => (c.description || c.overview || '').toLowerCase().includes(term));
                            
                            return titleMatch || genreMatch || castMatch || descMatch;`;

const replaceLogic = `                            const descMatch = (c.description || c.overview || '') && searchTerms.some(term => (c.description || c.overview || '').toLowerCase().includes(term));
                            const networkMatch = c.networks && (Array.isArray(c.networks) ? c.networks : Object.values(c.networks)).some(n => n && n.name && searchTerms.some(term => n.name.toLowerCase().includes(term)));
                            const studioMatch = c.production_companies && (Array.isArray(c.production_companies) ? c.production_companies : Object.values(c.production_companies)).some(n => n && n.name && searchTerms.some(term => n.name.toLowerCase().includes(term)));
                            const fallbackMatch = [c.network, c.studio, c.provider].filter(Boolean).some(val => typeof val === 'string' && searchTerms.some(term => val.toLowerCase().includes(term)));
                            
                            // Also check metadata specifically for exact 'netflix', 'amazon', etc as tags/genres if no network is found
                            const fallbackTagMatch = (c.tags || []).some(t => searchTerms.some(term => t.toLowerCase().includes(term)));

                            return titleMatch || genreMatch || castMatch || descMatch || networkMatch || studioMatch || fallbackMatch || fallbackTagMatch;`;

code = code.replace(targetLogic, replaceLogic);
fs.writeFileSync('index.html', code);
