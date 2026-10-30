import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix Coming Soon
content = re.sub(
    r"(const newR = \[.*?\.\.\.Object\.values\(tvShows\).*?\]);",
    r"\1.sort((a,b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));",
    content
)

# Ensure Movies and TV Shows are sorted (if not already)
if ".sort(" not in content.split("const allMoviesOnly =")[1].split(";")[0]:
    content = re.sub(
        r"(const allMoviesOnly = Object\.values\(movies\).*?map\(m=>\(\{\.\.\.m, type:'movie'\}\)\));",
        r"\1.sort((a,b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));",
        content
    )

if ".sort(" not in content.split("const allTvShows =")[1].split(";")[0]:
    content = re.sub(
        r"(const allTvShows = Object\.values\(tvShows\).*?map\(m=>\(\{\.\.\.m, type:'tv'\}\)\));",
        r"\1.sort((a,b) => (b.createdAt || b.timestamp || 0) - (a.createdAt || a.timestamp || 0));",
        content
    )

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Sorting applied.")
