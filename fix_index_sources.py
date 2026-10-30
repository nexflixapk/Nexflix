import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

sources_old = """            if(sourceData.videoUrl) sources.push({ label: 'Server 1', type: 'video', src: sourceData.videoUrl });
            if(sourceData.playUrl) sources.push({ label: 'Server 2', type: 'video', src: sourceData.playUrl });
            if(sourceData.iframeUrl) sources.push({ label: 'Server 3', type: 'iframeUrl', src: convertToEmbedUrl(sourceData.iframeUrl) });
            if(sourceData.iframeCode) sources.push({ label: 'Server 4', type: 'iframeCode', src: sourceData.iframeCode });"""
            
sources_new = """            if(sourceData.videoUrl) sources.push({ label: sourceData.server1Name || 'Server 1', type: 'video', src: sourceData.videoUrl });
            if(sourceData.playUrl) sources.push({ label: 'Auto Stream', type: 'video', src: sourceData.playUrl }); // Legacy
            if(sourceData.iframeUrl) sources.push({ label: sourceData.server2Name || 'Server 2', type: 'iframeUrl', src: convertToEmbedUrl(sourceData.iframeUrl) });
            if(sourceData.iframeCode) sources.push({ label: sourceData.server3Name || 'Server 3', type: 'iframeCode', src: sourceData.iframeCode });"""

if sources_old in content:
    content = content.replace(sources_old, sources_new)
else:
    print("Could not find sources_old")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated index.html sources map")
