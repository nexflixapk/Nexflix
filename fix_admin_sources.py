import re

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# For movies
movie_sources_old = """                            <div class="grid-2">
                                <div class="form-group">
                                    <label><i class="fas fa-video text-accent"></i> Official Trailer URL / Embed</label>
                                    <input type="url" id="m-trailerUrl" class="form-control" placeholder="YouTube trailer link or embed URL">
                                    <small style="color: var(--text-secondary); font-size: 0.8rem;">Enables the Trailer toggle switch in the detail modal.</small>
                                </div>
                                <div class="form-group">
                                    <label>Iframe Embed URL (Main Stream)</label>
                                    <input type="url" id="m-iframeUrl" class="form-control">
                                </div>
                            </div>
                            <div class="grid-2">
                                <div class="form-group">
                                    <label>Direct Video URL (MP4, WebM)</label>
                                    <input type="url" id="m-videoUrl" class="form-control">
                                </div>
                                <div class="form-group">
                                    <label>Download URL</label>
                                    <input type="url" id="m-downloadUrl" class="form-control">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Raw Iframe Embed Code</label>
                                <textarea id="m-iframeCode" class="form-control" placeholder="<iframe src='...'></iframe>"></textarea>
                            </div>"""

movie_sources_new = """                            <div class="grid-2">
                                <div class="form-group">
                                    <label><i class="fas fa-video text-accent"></i> Official Trailer URL / Embed</label>
                                    <input type="url" id="m-trailerUrl" class="form-control" placeholder="YouTube trailer link or embed URL">
                                    <small style="color: var(--text-secondary); font-size: 0.8rem;">Enables the Trailer toggle switch in the detail modal.</small>
                                </div>
                                <div class="form-group">
                                    <label>Download URL</label>
                                    <input type="url" id="m-downloadUrl" class="form-control">
                                </div>
                            </div>
                            
                            <h4 style="margin: 1.5rem 0 0.5rem; color: #fff; font-size: 1.1rem;">Streaming Servers</h4>
                            <div class="grid-2">
                                <div class="form-group">
                                    <label>Server 1 Name</label>
                                    <input type="text" id="m-server1Name" class="form-control" placeholder="e.g. Google Drive">
                                </div>
                                <div class="form-group">
                                    <label>Server 1 URL (Direct or Iframe)</label>
                                    <input type="url" id="m-videoUrl" class="form-control">
                                </div>
                            </div>
                            <div class="grid-2">
                                <div class="form-group">
                                    <label>Server 2 Name</label>
                                    <input type="text" id="m-server2Name" class="form-control" placeholder="e.g. Mega">
                                </div>
                                <div class="form-group">
                                    <label>Server 2 URL (Direct or Iframe)</label>
                                    <input type="url" id="m-iframeUrl" class="form-control">
                                </div>
                            </div>
                            <div class="grid-2">
                                <div class="form-group">
                                    <label>Server 3 Name</label>
                                    <input type="text" id="m-server3Name" class="form-control" placeholder="e.g. Streamtape">
                                </div>
                                <div class="form-group">
                                    <label>Server 3 URL (Direct or Iframe)</label>
                                    <input type="url" id="m-iframeCode" class="form-control">
                                </div>
                            </div>"""
if movie_sources_old in content:
    content = content.replace(movie_sources_old, movie_sources_new)
else:
    print("Could not find movie_sources_old")

# For episodes
ep_add_old = """                                            <div class="form-group"><label>Video URL / Direct Link</label><input type="text" class="form-control ep-vid" value="${(ep.videoUrl || '').replace(/"/g, '&quot;')}"></div>
                                            <div class="form-group"><label>Iframe / Stream URL</label><input type="text" class="form-control ep-frame" value="${(ep.iframeUrl || '').replace(/"/g, '&quot;')}"></div>
                                            <div class="form-group"><label><i class="fas fa-download text-accent"></i> Download URL</label><input type="text" class="form-control ep-dl" placeholder="Direct file / Drive / Cloud link" value="${(ep.downloadUrl || ep.downloadLink || '').replace(/"/g, '&quot;')}"></div>"""
ep_add_new = """                                            <div class="form-group"><label>S1 Name</label><input type="text" class="form-control ep-s1-name" placeholder="Server 1" value="${(ep.server1Name || '').replace(/"/g, '&quot;')}"></div>
                                            <div class="form-group"><label>Server 1 URL</label><input type="text" class="form-control ep-vid" value="${(ep.videoUrl || '').replace(/"/g, '&quot;')}"></div>
                                            <div class="form-group"><label>S2 Name</label><input type="text" class="form-control ep-s2-name" placeholder="Server 2" value="${(ep.server2Name || '').replace(/"/g, '&quot;')}"></div>
                                            <div class="form-group"><label>Server 2 URL</label><input type="text" class="form-control ep-frame" value="${(ep.iframeUrl || '').replace(/"/g, '&quot;')}"></div>
                                            <div class="form-group"><label>S3 Name</label><input type="text" class="form-control ep-s3-name" placeholder="Server 3" value="${(ep.server3Name || '').replace(/"/g, '&quot;')}"></div>
                                            <div class="form-group"><label>Server 3 URL</label><input type="text" class="form-control ep-code" value="${(ep.iframeCode || '').replace(/"/g, '&quot;')}"></div>
                                            <div class="form-group"><label>Download</label><input type="text" class="form-control ep-dl" placeholder="Download Link" value="${(ep.downloadUrl || ep.downloadLink || '').replace(/"/g, '&quot;')}"></div>"""
content = content.replace(ep_add_old, ep_add_new)

ep_add_blank_old = """                                        <div class="grid-3">
                                            <div class="form-group"><label>Video URL / Direct Link</label><input type="text" class="form-control ep-vid"></div>
                                            <div class="form-group"><label>Iframe / Stream URL</label><input type="text" class="form-control ep-frame"></div>
                                            <div class="form-group"><label><i class="fas fa-download text-accent"></i> Download URL</label><input type="text" class="form-control ep-dl" placeholder="Direct file / Drive / Cloud link"></div>
                                        </div>"""
ep_add_blank_new = """                                        <div class="grid-3">
                                            <div class="form-group"><label>S1 Name</label><input type="text" class="form-control ep-s1-name" placeholder="Server 1"></div>
                                            <div class="form-group"><label>Server 1 URL</label><input type="text" class="form-control ep-vid"></div>
                                            <div class="form-group"><label>S2 Name</label><input type="text" class="form-control ep-s2-name" placeholder="Server 2"></div>
                                            <div class="form-group"><label>Server 2 URL</label><input type="text" class="form-control ep-frame"></div>
                                            <div class="form-group"><label>S3 Name</label><input type="text" class="form-control ep-s3-name" placeholder="Server 3"></div>
                                            <div class="form-group"><label>Server 3 URL</label><input type="text" class="form-control ep-code"></div>
                                            <div class="form-group"><label>Download</label><input type="text" class="form-control ep-dl" placeholder="Download Link"></div>
                                        </div>"""
content = content.replace(ep_add_blank_old, ep_add_blank_new)

# Movie Data Loading
m_load_old = """                document.getElementById('m-videoUrl').value = m.videoUrl || '';
                document.getElementById('m-iframeUrl').value = m.iframeUrl || '';
                document.getElementById('m-downloadUrl').value = m.downloadUrl || '';
                document.getElementById('m-iframeCode').value = m.iframeCode || '';"""
m_load_new = """                document.getElementById('m-videoUrl').value = m.videoUrl || '';
                document.getElementById('m-iframeUrl').value = m.iframeUrl || '';
                document.getElementById('m-downloadUrl').value = m.downloadUrl || '';
                document.getElementById('m-iframeCode').value = m.iframeCode || '';
                if(document.getElementById('m-server1Name')) document.getElementById('m-server1Name').value = m.server1Name || '';
                if(document.getElementById('m-server2Name')) document.getElementById('m-server2Name').value = m.server2Name || '';
                if(document.getElementById('m-server3Name')) document.getElementById('m-server3Name').value = m.server3Name || '';"""
content = content.replace(m_load_old, m_load_new)

# Movie Saving
m_save_old = """                iframeUrl: document.getElementById('m-iframeUrl').value,
                iframeCode: document.getElementById('m-iframeCode').value,"""
m_save_new = """                iframeUrl: document.getElementById('m-iframeUrl').value,
                iframeCode: document.getElementById('m-iframeCode').value,
                server1Name: document.getElementById('m-server1Name') ? document.getElementById('m-server1Name').value : '',
                server2Name: document.getElementById('m-server2Name') ? document.getElementById('m-server2Name').value : '',
                server3Name: document.getElementById('m-server3Name') ? document.getElementById('m-server3Name').value : '',"""
content = content.replace(m_save_old, m_save_new)

# Episode Save extraction
ep_extract_old = """                        iframeUrl: eb.querySelector('.ep-frame').value,
                        downloadUrl: eb.querySelector('.ep-dl') ? eb.querySelector('.ep-dl').value : '',
                        iframeCode: eb.querySelector('.ep-code') ? eb.querySelector('.ep-code').value : ''"""
ep_extract_new = """                        iframeUrl: eb.querySelector('.ep-frame').value,
                        downloadUrl: eb.querySelector('.ep-dl') ? eb.querySelector('.ep-dl').value : '',
                        iframeCode: eb.querySelector('.ep-code') ? eb.querySelector('.ep-code').value : '',
                        server1Name: eb.querySelector('.ep-s1-name') ? eb.querySelector('.ep-s1-name').value : '',
                        server2Name: eb.querySelector('.ep-s2-name') ? eb.querySelector('.ep-s2-name').value : '',
                        server3Name: eb.querySelector('.ep-s3-name') ? eb.querySelector('.ep-s3-name').value : ''"""
content = content.replace(ep_extract_old, ep_extract_new)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated admin.html")
