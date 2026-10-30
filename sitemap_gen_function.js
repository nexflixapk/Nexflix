const fs = require('fs');

let adminHtml = fs.readFileSync('admin.html', 'utf8');

const sitemapFunc = `
        window.generateSitemap = async function() {
            const btn = document.querySelector('button[onclick="generateSitemap()"]');
            const originalHtml = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
            btn.disabled = true;

            try {
                // Fetch data from Firebase
                const snapshot = await window.get(window.ref(window.db, 'content'));
                let contentData = {};
                if (snapshot.exists()) {
                    contentData = snapshot.val();
                }

                // Helper to escape XML special characters
                const escapeXml = (unsafe) => {
                    return (unsafe || '').replace(/[<>&'"]/g, function (c) {
                        switch (c) {
                            case '<': return '&lt;';
                            case '>': return '&gt;';
                            case '&': return '&amp;';
                            case '\\'': return '&apos;';
                            case '"': return '&quot;';
                        }
                    });
                };

                // Base URL, assuming the current domain
                const baseUrl = window.location.origin + window.location.pathname.replace('/admin.html', '/');
                
                let urls = [];
                // Static pages
                urls.push({ loc: baseUrl, changefreq: 'daily', priority: '1.0' });
                urls.push({ loc: baseUrl + '#movies', changefreq: 'daily', priority: '0.8' });
                urls.push({ loc: baseUrl + '#tv', changefreq: 'daily', priority: '0.8' });
                urls.push({ loc: baseUrl + '#new', changefreq: 'daily', priority: '0.8' });

                // Dynamic content pages (Movies and TV Shows)
                for (let key in contentData) {
                    const item = contentData[key];
                    if (item.type === 'movie') {
                        urls.push({ loc: baseUrl + '#movie/' + key, changefreq: 'weekly', priority: '0.6' });
                        urls.push({ loc: baseUrl + '#watch/movie/' + key, changefreq: 'monthly', priority: '0.5' });
                    } else if (item.type === 'tv') {
                        urls.push({ loc: baseUrl + '#tv/' + key, changefreq: 'weekly', priority: '0.6' });
                        // Optionally add episodes if needed, but usually just the series page is enough for sitemap
                        if (item.seasons) {
                            for (let s in item.seasons) {
                                let season = item.seasons[s];
                                if (season.episodes) {
                                    for (let e in season.episodes) {
                                        urls.push({ loc: baseUrl + '#watch/tv/' + key + '/' + season.seasonNumber + '/' + e, changefreq: 'monthly', priority: '0.4' });
                                    }
                                }
                            }
                        }
                    }
                }

                // Construct XML
                let xml = '<?xml version="1.0" encoding="UTF-8"?>\\n';
                xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n';
                
                urls.forEach(u => {
                    xml += '  <url>\\n';
                    xml += '    <loc>' + escapeXml(u.loc) + '</loc>\\n';
                    xml += '    <changefreq>' + u.changefreq + '</changefreq>\\n';
                    xml += '    <priority>' + u.priority + '</priority>\\n';
                    xml += '  </url>\\n';
                });
                
                xml += '</urlset>';

                const outputArea = document.getElementById('sitemap-output');
                outputArea.value = xml;
                outputArea.classList.remove('hidden');

                // Trigger download
                const blob = new Blob([xml], { type: 'application/xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'sitemap.xml';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                btn.innerHTML = '<i class="fas fa-check text-white"></i> Generated';
                setTimeout(() => {
                    btn.innerHTML = originalHtml;
                    btn.disabled = false;
                }, 3000);

            } catch (error) {
                console.error(error);
                alert('Error generating sitemap. See console.');
                btn.innerHTML = originalHtml;
                btn.disabled = false;
            }
        };
`;

if (!adminHtml.includes('window.generateSitemap =')) {
    const target = 'const loginScreen = document.getElementById(';
    adminHtml = adminHtml.replace(target, sitemapFunc + '\n        ' + target);
    fs.writeFileSync('admin.html', adminHtml);
    console.log('Injected generateSitemap into admin.html');
} else {
    // If it already exists, replace it
    console.log('generateSitemap already exists, replacing it.');
    const regex = /window\.generateSitemap\s*=\s*(async\s*)?function\s*\(\)\s*\{[\s\S]*?\n\s*\};/m;
    adminHtml = adminHtml.replace(regex, sitemapFunc.trim());
    fs.writeFileSync('admin.html', adminHtml);
}
