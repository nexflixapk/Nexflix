import re
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Update generateRow
row_regex = r'(<a href="\${link}" class="[^"]*group")>'
if 'onmouseenter="startPreview' not in content:
    content = re.sub(
        row_regex,
        r'\1 onmouseenter="startPreview(this, \'${item.type}\', \'${item.id}\', \'${(item.title||item.name||\"\").replace(/\'/g, \"\\\\\'\").replace(/\"/g, \"&quot;\")}\', \'${item.year||\"\"}\')" onmouseleave="stopPreview(this)">',
        content
    )

img_regex = r'(<img src="\${item.poster \|\| \'https://via.placeholder.com/300x450\?text=No\+Image\'}" loading="lazy" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity">)'
content = re.sub(
    img_regex,
    r'<div class="n-badge z-30"></div>\n                        \1\n                        <div class="preview-video-wrapper absolute inset-0 z-10 hidden transition-opacity duration-300 bg-black pointer-events-none rounded-xl overflow-hidden"></div>',
    content
)
# Cleanup duplicate n-badge
content = content.replace('<div class="n-badge"></div>\n                        <div class="n-badge z-30"></div>', '<div class="n-badge z-30"></div>')
content = content.replace('<div class="n-badge"></div>\n                        <img src="${item.poster', '<img src="${item.poster')

# Update generateTop10Row
top10_row_regex = r'(<a href="#\${type}/\${item.id}" class="[^"]*group[^"]*")>'
content = re.sub(
    top10_row_regex,
    r'\1 onmouseenter="startPreview(this, \'${type}\', \'${item.id}\', \'${(item.title||item.name||\"\").replace(/\'/g, \"\\\\\'\").replace(/\"/g, \"&quot;\")}\', \'${item.year||\"\"}\')" onmouseleave="stopPreview(this)">',
    content
)

top10_img_regex = r'(<img src="\${item.poster}" loading="lazy" class="w-full h-full object-cover relative z-0">)'
content = re.sub(
    top10_img_regex,
    r'\1\n                            <div class="preview-video-wrapper absolute inset-0 z-10 hidden transition-opacity duration-300 bg-black pointer-events-none rounded overflow-hidden"></div>',
    content
)

script_to_add = """
        // ==========================
        // HOVER VIDEO PREVIEWS
        // ==========================
        let currentHoverTimer = null;
        let currentPreviewEl = null;

        window.startPreview = function(el, type, id, title, year) {
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
"""

if "window.startPreview = function" not in content:
    content = content.replace("// ==========================\n        // TRAILER MODAL", script_to_add + "\n        // ==========================\n        // TRAILER MODAL")


with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
