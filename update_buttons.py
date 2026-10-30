import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the detail-meta font look like the screenshot (green year, simple text)
old_meta = """<div class="detail-meta" style="align-items: center; display: flex; gap: 10px;">"""
new_meta = """<div class="detail-meta" style="align-items: center; display: flex; gap: 12px; font-weight: 600; font-size: 1.05rem;">"""
content = content.replace(old_meta, new_meta)

old_year = """<span id="dm-year" style="padding: 2px 6px; background: #444; border-radius: 3px; font-size: 0.8rem; margin-left: 5px;">Year</span>"""
new_year = """<span id="dm-year" style="color: #10b981;">Year</span>"""
content = content.replace(old_year, new_year)

old_genre = """<span id="dm-genre" style="display: inline-block; padding: 6px 14px; background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.15); color: var(--text-primary); border-radius: 30px; font-size: 0.85rem; font-weight: 500; letter-spacing: 0.5px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);">Genre</span>"""
new_genre = """<span id="dm-genre" style="display: inline-block; padding: 4px 14px; background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: #ccc; border-radius: 20px; font-size: 0.9rem; font-weight: 500;">Genre</span>"""
content = content.replace(old_genre, new_genre)

# Re-style buttons
old_actions = """<div class="detail-actions">
                        <button class="btn btn-primary btn-colorful hidden" id="dm-resume-btn"><i class="fas fa-play"></i> <span id="dm-resume-text">Resume</span></button>
                        <button class="btn btn-primary btn-colorful" id="dm-play-btn"><i class="fas fa-play"></i> <span id="dm-play-text">Play</span></button>
                        <button class="btn btn-secondary" id="dm-trailer-trigger-btn" onclick="manualTriggerTrailer(event)"><i class="fas fa-film"></i> Watch Trailer</button>
                        <button class="btn btn-secondary" id="dm-watchlist-btn"><i class="far fa-bookmark"></i> Watchlist</button>
                        <button class="btn btn-secondary" id="dm-fav-btn"><i class="far fa-heart"></i> Favorite</button>
                        <button class="btn btn-outline" id="dm-watchparty-btn" onclick="openWatchPartyModal()"><i class="fas fa-users" style="color: #a855f7;"></i> Watch Party</button>
                        <button class="btn btn-outline" id="dm-report-btn" onclick="openModal('report-modal')"><i class="fas fa-flag"></i> Report</button>
                        <button class="btn btn-outline" id="dm-share-btn" onclick="shareContent()"><i class="fas fa-share-alt"></i> Share</button>
                        <a id="dm-download-btn" class="btn btn-outline hidden" ><i class="fas fa-download"></i> Download</a>
                    </div>"""
new_actions = """<div class="detail-extra-info" style="display: flex; gap: 3rem; margin-top: 1rem; margin-bottom: 2rem; color: #a1a1aa; font-size: 0.95rem;">
                        <div><strong style="color: white; margin-right: 5px;">Country:</strong> N/A</div>
                        <div><strong style="color: white; margin-right: 5px;">Language:</strong> N/A</div>
                        <div><strong style="color: white; margin-right: 5px;">Release:</strong> <span id="dm-release-date-text">N/A</span></div>
                    </div>
                    <div class="detail-actions" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <button class="btn hidden" id="dm-resume-btn" style="background: #e50914; color: white; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 1.1rem; border: none; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: background 0.2s;"><i class="fas fa-play"></i> <span id="dm-resume-text">Resume</span></button>
                        <button class="btn" id="dm-play-btn" style="background: #e50914; color: white; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 1.1rem; border: none; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: background 0.2s;"><i class="fas fa-play"></i> <span id="dm-play-text">Watch Movie</span></button>
                        <button class="btn" id="dm-fav-btn" style="background: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 1.1rem; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: background 0.2s;"><i class="fas fa-heart"></i> Add to Favorites</button>
                        <button class="btn" id="dm-trailer-trigger-btn" onclick="manualTriggerTrailer(event)" style="background: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 1.1rem; display: flex; align-items: center; gap: 10px; cursor: pointer;"><i class="fas fa-film"></i> Trailer</button>
                        
                        <!-- Secondary actions grouped nicely or hidden -->
                        <div style="display: flex; gap: 0.5rem; align-items: center; margin-left: auto;">
                            <button class="btn" id="dm-watchlist-btn" style="background: transparent; color: white; border: none; font-size: 1.2rem; cursor: pointer;" title="Watchlist"><i class="far fa-bookmark"></i></button>
                            <button class="btn" id="dm-watchparty-btn" onclick="openWatchPartyModal()" style="background: transparent; color: white; border: none; font-size: 1.2rem; cursor: pointer;" title="Watch Party"><i class="fas fa-users" style="color: #a855f7;"></i></button>
                            <button class="btn" id="dm-share-btn" onclick="shareContent()" style="background: transparent; color: white; border: none; font-size: 1.2rem; cursor: pointer;" title="Share"><i class="fas fa-share-alt"></i></button>
                            <a id="dm-download-btn" class="btn hidden" style="background: transparent; color: white; border: none; font-size: 1.2rem; cursor: pointer; text-decoration: none;" title="Download"><i class="fas fa-download"></i></a>
                        </div>
                    </div>"""
content = content.replace(old_actions, new_actions)

# Update openDetail release date binding
old_func = """document.getElementById('dm-original-title').innerText = origTitle && origTitle !== activeContent.title ? origTitle : '';"""
new_func = """document.getElementById('dm-original-title').innerText = origTitle && origTitle !== activeContent.title ? origTitle : '';
            document.getElementById('dm-release-date-text').innerText = activeContent.releaseDate || 'N/A';
            document.getElementById('dm-play-text').innerText = type === 'movie' ? 'Watch Movie' : 'Watch Episode 1';"""
content = content.replace(old_func, new_func)

# Fix detail-hero wrapper close div
old_end = """<!-- TV Show Specific Area -->"""
new_end = """</div><!-- End detail-content-flex -->
                </div><!-- End detail-hero-wrapper -->
                <!-- TV Show Specific Area -->"""
content = content.replace(old_end, new_end)


with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Buttons updated.")
