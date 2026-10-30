const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const oldFilter = `                        displayResults = allContent.filter(c => 
                            c.title.toLowerCase().includes(query.toLowerCase()) || 
                            (c.genres && c.genres.some(g => g.toLowerCase().includes(query.toLowerCase()))) ||
                            (c.cast && (Array.isArray(c.cast) ? c.cast : Object.values(c.cast)).some(actor => actor.name && actor.name.toLowerCase().includes(query.toLowerCase())))
                        );`;

const newFilter = `                        const qLower = query.toLowerCase().trim();
                        const searchTerms = qLower.split(' ').filter(t => t.length > 0);
                        
                        displayResults = allContent.filter(c => {
                            const titleMatch = c.title && searchTerms.every(term => c.title.toLowerCase().includes(term));
                            const genreMatch = c.genres && c.genres.some(g => searchTerms.some(term => g.toLowerCase().includes(term)));
                            const castMatch = c.cast && (Array.isArray(c.cast) ? c.cast : Object.values(c.cast)).some(actor => actor.name && searchTerms.some(term => actor.name.toLowerCase().includes(term)));
                            const descMatch = (c.description || c.overview || '') && searchTerms.some(term => (c.description || c.overview || '').toLowerCase().includes(term));
                            
                            return titleMatch || genreMatch || castMatch || descMatch;
                        });`;

content = content.replace(oldFilter, newFilter);

content = content.replace(/timeout = setTimeout\(\(\) => executeSearch\(e\.target\.value\), 600\);/g, "timeout = setTimeout(() => executeSearch(e.target.value), 200);");

fs.writeFileSync('index.html', content);
