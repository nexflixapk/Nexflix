import re
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Update TMDB row
tmdb_row_regex = r'(<div onclick="openTMDBDetailsModal\([^"]+\)" class="[^"]*group")>'
content = re.sub(
    tmdb_row_regex,
    r'\1 onmouseenter="startPreview(this, \'${item.type}\', \'${item.id}\')" onmouseleave="stopPreview(this)">',
    content
)

tmdb_img_regex = r'(<img src="\${item.poster}" loading="lazy" class="w-full h-full object-cover group-hover:opacity-50 transition">)'
content = re.sub(
    tmdb_img_regex,
    r'\1\n                                    <div class="preview-video-wrapper absolute inset-0 z-10 hidden transition-opacity duration-300 bg-black pointer-events-none rounded overflow-hidden"></div>',
    content
)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
