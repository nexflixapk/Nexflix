import re
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix bengali Hits sorting
content = content.replace(
    "if(bengaliHits.length > 0) html += generateRow('Bengali Hit Movies & TV Shows', bengaliHits, 'section-bengali-hits');",
    "bengaliHits.sort((a,b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));\n            if(bengaliHits.length > 0) html += generateRow('Bengali Hit Movies & TV Shows', bengaliHits, 'section-bengali-hits');"
)

indian_hits_code = """
            // Indian Hit Cinemas
            const indianHits = allContentGlob.filter(m => 
                (m.audioLang && m.audioLang.some(l => ['hindi', 'tamil', 'telugu', 'malayalam', 'kannada', 'indian'].some(k => l.toLowerCase().includes(k)))) ||
                (m.genres && m.genres.some(g => ['hindi', 'tamil', 'telugu', 'malayalam', 'kannada', 'indian', 'bollywood', 'tollywood'].some(k => g.toLowerCase().includes(k)))) ||
                (m.collections && m.collections.some(g => ['hindi', 'tamil', 'telugu', 'malayalam', 'kannada', 'indian', 'bollywood', 'tollywood'].some(k => g.toLowerCase().includes(k))))
            ).sort((a,b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));
            if(indianHits.length > 0) html += generateRow('Indian Hit Cinemas', indianHits, 'section-indian-hits');
"""

if "Indian Hit Cinemas" not in content:
    content = content.replace(
        "// Bengali Hit Movies & TV Shows",
        indian_hits_code + "\n            // Bengali Hit Movies & TV Shows"
    )

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
