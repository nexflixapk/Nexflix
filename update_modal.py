import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the detail modal layout
old_layout = """<div class="detail-hero" id="dm-backdrop">"""
new_layout = """<div class="detail-hero-wrapper" style="position: relative; min-height: 70vh; display: flex; align-items: center; justify-content: center;">
                <div class="detail-hero" id="dm-backdrop" style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.3; mask-image: linear-gradient(to right, transparent 10%, black 70%); -webkit-mask-image: linear-gradient(to right, transparent 10%, black 70%); min-height: unset;">"""

content = content.replace(old_layout, new_layout)

# Replace detail-body start
old_body = """                <div class="detail-body">
                    <h2 class="detail-title" id="dm-title">Title</h2>"""
new_body = """                </div>
                <!-- Flex container for poster and details -->
                <div class="detail-content-flex" style="position: relative; z-index: 10; display: flex; gap: 3rem; padding: 4rem 2rem; max-width: 1200px; width: 100%; margin: 0 auto; align-items: flex-start; flex-wrap: wrap;">
                    <div class="detail-poster" style="flex-shrink: 0; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.8); background: #222;">
                        <img id="dm-poster-img" src="" alt="Poster" style="width: 280px; display: block;">
                    </div>
                    <div class="detail-body" style="flex: 1; min-width: 300px; padding: 0; margin-top: 0; margin-bottom: 2rem;">
                        <h2 class="detail-title" id="dm-title" style="font-size: 3.5rem; font-weight: 800; text-shadow: 0 2px 10px rgba(0,0,0,0.5); margin-bottom: 0.5rem; line-height: 1.1;">Title</h2>
                        <div id="dm-original-title" style="font-size: 1.2rem; color: #a1a1aa; font-style: italic; margin-bottom: 1rem;"></div>"""

content = content.replace(old_body, new_body)

# Update openDetail function to populate the poster
old_func = """document.getElementById('dm-backdrop').style.backgroundImage = `url('${dmBg}')`;"""
new_func = """document.getElementById('dm-backdrop').style.backgroundImage = `url('${dmBg}')`;
            document.getElementById('dm-poster-img').src = activeContent.poster || '';
            const origTitle = activeContent.original_title || activeContent.original_name;
            document.getElementById('dm-original-title').innerText = origTitle && origTitle !== activeContent.title ? origTitle : '';"""

content = content.replace(old_func, new_func)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated index.html layout and JS")
