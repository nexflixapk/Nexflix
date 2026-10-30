import re
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the bad function calls in HTML with a clean one
content = re.sub(
    r'onmouseenter="startPreview\(this,[^"]+\)" onmouseleave="stopPreview\(this\)">',
    r'onmouseenter="startPreview(this, \'${item.type}\', \'${item.id}\')" onmouseleave="stopPreview(this)">',
    content
)
# Top10 uses type instead of item.type
content = re.sub(
    r'onmouseenter="startPreview\(this, \'\${type}\', \'\${item.id}\',[^"]+\)" onmouseleave="stopPreview\(this\)">',
    r'onmouseenter="startPreview(this, \'${type}\', \'${item.id}\')" onmouseleave="stopPreview(this)">',
    content
)

# Replace the signature of startPreview
new_start_preview = """window.startPreview = function(el, type, id) {
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
"""

content = re.sub(
    r'window\.startPreview = function\(el, type, id, title, year\) \{.*?(?=let key = \(window\.appSettings)',
    new_start_preview,
    content,
    flags=re.DOTALL
)


with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
