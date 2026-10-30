import re
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix generateRow
bad_str = r"'${(item.title||item.name||\"\").replace(/\'/g, \"\\'").replace(/\"/g, \"&quot;\")}'"
content = content.replace(bad_str, r"'${(item.title||item.name||\"\").replace(/'/g, \"\\'\").replace(/\"/g, \"&quot;\")}'")

# Wait, let's just make it simple: replace the whole onmouseenter handler to avoid string escaping nightmare inside template literal.
# We can use dataset or just encodeURIComponent(title) and decode it in the handler!
