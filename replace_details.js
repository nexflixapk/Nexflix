const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const startIndex = content.indexOf('<!-- Content Detail View -->');
const endIndex = content.indexOf('</main>', startIndex) + '</main>'.length;

const newHTML = `    <!-- Content Detail Modal (Netflix Style) -->
    <div class="modal-overlay" id="details-modal" style="display: none; align-items: flex-start; z-index: 2000; padding-top: 5vh; overflow-y: auto;">
        <div class="modal-content" style="max-width: 900px; width: 95%; background: #181818; padding: 0; position: relative; margin-bottom: 5vh; box-shadow: 0 0 30px rgba(0,0,0,0.8); border: none; border-radius: 12px; overflow: hidden; pointer-events: auto;">
            <button class="modal-close" onclick="closeDetailsModal()" style="background: #181818; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 10;"><i class="fas fa-times"></i></button>
            
            <div id="dv-bg" class="detail-hero-banner" style="position: relative; width: 100%; height: 450px; background-size: cover; background-position: center; border-radius: 12px 12px 0 0;">
                <div class="detail-hero-vignette" style="position: absolute; bottom: 0; left: 0; right: 0; height: 150px; background: linear-gradient(to top, #181818 10%, transparent);"></div>
                <div class="detail-hero-content" style="position: absolute; bottom: 30px; left: 40px; right: 40px; z-index: 2;">
                    <h1 id="dm-title-text" style="font-size: 3rem; font-weight: 800; margin-bottom: 10px; line-height: 1.1; text-shadow: 0 2px 4px rgba(0,0,0,0.8); color: white;">Title</h1>
                    <h3 id="dm-original-title" style="font-size: 1rem; color: #ccc; margin-bottom: 15px; font-weight: normal; font-style: italic; text-shadow: 0 1px 2px rgba(0,0,0,0.8);"></h3>
                    
                    <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 20px; font-weight: 600; flex-wrap: wrap; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">
                        <span style="color: #4ade80;">98% Match</span>
                        <span id="dm-year-text" style="color: white;">2019</span>
                        <span id="dm-duration-text" style="color: white;">172 min</span>
                        <span style="border: 1px solid rgba(255,255,255,0.4); padding: 0 6px; border-radius: 3px; font-size: 0.8rem; color: #ccc;">HD</span>
                        <span style="color: #fbbf24; display: flex; align-items: center; gap: 5px;"><i class="fas fa-star"></i> <span id="dm-rating-val">6.4</span></span>
                    </div>

                    <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                        <button id="dm-play-btn" style="background: white; color: black; padding: 10px 30px; font-size: 1.1rem; font-weight: bold; border-radius: 4px; border: none; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: background 0.2s;"><i class="fas fa-play"></i> Play</button>
                        <button id="dm-watchlist-btn" style="background: rgba(42,42,42,0.6); color: white; width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.4); cursor: pointer; display: flex; justify-content: center; align-items: center; transition: 0.2s;"><i class="fas fa-plus"></i></button>
                        <button id="dm-fav-btn" style="background: rgba(42,42,42,0.6); color: white; width: 44px; height: 44px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.4); cursor: pointer; display: flex; justify-content: center; align-items: center; transition: 0.2s;"><i class="far fa-thumbs-up"></i></button>
                    </div>
                </div>
            </div>

            <div class="detail-body-content" style="padding: 0 40px 40px 40px; color: #fff;">
                <div style="display: flex; gap: 40px; flex-wrap: wrap; margin-top: 10px;">
                    <div style="flex: 2; min-width: 300px;">
                        <p id="dm-desc-text" style="font-size: 1.05rem; line-height: 1.5; color: #fff; margin-bottom: 20px;"></p>
                    </div>
                    <div style="flex: 1; min-width: 250px; font-size: 0.9rem; color: #fff; display: flex; flex-direction: column; gap: 8px;">
                        <div><span style="color: #777;">Cast:</span> <span id="dm-cast-text">N/A</span></div>
                        <div><span style="color: #777;">Genres:</span> <span id="dm-genres-text">N/A</span></div>
                        <div><span style="color: #777;">Country:</span> <span id="dm-country">N/A</span></div>
                        <div><span style="color: #777;">Language:</span> <span id="dm-lang">N/A</span></div>
                    </div>
                </div>

                <!-- TV Show Specific Area -->
                <div id="dm-tv-area" class="hidden" style="margin-top: 40px; border-top: 2px solid #333; padding-top: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                        <h3 style="font-size: 1.5rem; margin: 0; color: white;">Episodes</h3>
                        <div style="display: flex; gap: 15px;">
                            <select class="season-selector" id="dm-season-select" style="background: #222; color: white; border: 1px solid #444; padding: 8px 16px; border-radius: 4px; font-size: 1rem; font-weight: bold;"></select>
                        </div>
                    </div>
                    <div class="episode-list" id="dm-episode-list" style="display: flex; flex-direction: column; gap: 10px;"></div>
                </div>
                
                <!-- Related Content -->
                <div id="dm-related-section" class="related-content-section" style="margin-top: 40px; border-top: 2px solid #333; padding-top: 20px;">
                    <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 20px; color: white;">More Like This</h3>
                    <div class="related-grid" id="dm-related-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 15px;">
                        <!-- Populated dynamically -->
                    </div>
                </div>
            </div>
        </div>
    </div>`;

const finalHTML = content.substring(0, startIndex) + newHTML + content.substring(endIndex);
fs.writeFileSync('index.html', finalHTML);
