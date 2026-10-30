import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

old_rating = """<span class="hero-rating" id="dm-rating" style="display: none;">Rating</span>"""
new_rating = """<span class="hero-rating" id="dm-rating" style="display: none; align-items: center; gap: 5px; font-weight: bold; color: white;"><i class="fas fa-star" style="color: #fbbf24;"></i> <span id="dm-rating-val"></span></span>"""
content = content.replace(old_rating, new_rating)

old_func = """document.getElementById('dm-type').innerText = type === 'movie' ? 'Movie' : 'TV Show';"""
new_func = """document.getElementById('dm-type').innerText = type === 'movie' ? 'Movie' : 'TV Show';
            if (activeContent.rating) {
                document.getElementById('dm-rating').style.display = 'flex';
                document.getElementById('dm-rating-val').innerText = activeContent.rating;
            } else {
                document.getElementById('dm-rating').style.display = 'none';
            }"""
content = content.replace(old_func, new_func)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Rating updated.")
