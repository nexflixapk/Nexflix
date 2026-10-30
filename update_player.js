const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Inject countdown overlay into video-wrapper
const videoWrapperHtml = `<video id="main-video" class="w-full h-full object-contain bg-black"></video>`;
const countdownHtml = `
                        <!-- Autoplay Countdown Overlay -->
                        <div id="autoplay-countdown-overlay" class="absolute inset-0 bg-black/90 flex-col items-center justify-center z-30 hidden animate-fade-in text-white">
                            <h3 class="text-2xl md:text-4xl font-bold mb-4">Next Episode in <span id="countdown-timer" class="text-netflixRed text-5xl ml-2 font-mono">5</span></h3>
                            <p class="text-gray-300 mb-8 text-lg md:text-xl font-medium" id="countdown-next-title"></p>
                            <div class="flex gap-4">
                                <button id="countdown-play-now" class="bg-white text-black px-6 py-2.5 rounded font-bold hover:bg-gray-200 transition flex items-center gap-2"><i class="fas fa-play"></i> Play Now</button>
                                <button id="countdown-cancel" class="bg-gray-800 text-white px-6 py-2.5 rounded font-bold hover:bg-gray-700 transition">Cancel</button>
                            </div>
                        </div>
`;
content = content.replace(videoWrapperHtml, videoWrapperHtml + '\n' + countdownHtml);

// 2. Update ended listener in renderPlayer
const endedListenerRegex = /video\.addEventListener\('ended', \(\) => \{[\s\S]*?\}\);/m;
const newEndedListener = `
                video.addEventListener('ended', () => {
                    const autoplayToggle = document.getElementById('autoplay-toggle');
                    if (autoplayToggle && !autoplayToggle.checked) return;

                    const seasonsList = Object.values(itemDetails.seasons).filter(s => s != null);
                    const sData = seasonsList.find(s => s.seasonNumber == season);
                    
                    let nextHash = null;
                    let nextTitleStr = '';
                    
                    if (sData && sData.episodes) {
                        const epKeys = Object.keys(sData.episodes).sort((a,b) => parseInt(sData.episodes[a].episodeNumber) - parseInt(sData.episodes[b].episodeNumber));
                        const currentIndex = epKeys.indexOf(episode);
                        if (currentIndex !== -1 && currentIndex + 1 < epKeys.length) {
                            const nextEp = epKeys[currentIndex + 1];
                            nextHash = \`#watch/tv/\${id}/\${season}/\${nextEp}\`;
                            nextTitleStr = \`Season \${season} Episode \${sData.episodes[nextEp].episodeNumber}: \${sData.episodes[nextEp].title}\`;
                        } else {
                            const nextSeasonNum = parseInt(season) + 1;
                            const nextSeason = seasonsList.find(s => s.seasonNumber == nextSeasonNum);
                            if (nextSeason && nextSeason.episodes) {
                                const nextSEpKeys = Object.keys(nextSeason.episodes).sort((a,b) => parseInt(nextSeason.episodes[a].episodeNumber) - parseInt(nextSeason.episodes[b].episodeNumber));
                                if (nextSEpKeys.length > 0) {
                                    nextHash = \`#watch/tv/\${id}/\${nextSeasonNum}/\${nextSEpKeys[0]}\`;
                                    nextTitleStr = \`Season \${nextSeasonNum} Episode \${nextSeason.episodes[nextSEpKeys[0]].episodeNumber}: \${nextSeason.episodes[nextSEpKeys[0]].title}\`;
                                }
                            }
                        }
                    }
                    
                    if (nextHash) {
                        const overlay = document.getElementById('autoplay-countdown-overlay');
                        const timerSpan = document.getElementById('countdown-timer');
                        const titleEl = document.getElementById('countdown-next-title');
                        const playNowBtn = document.getElementById('countdown-play-now');
                        const cancelBtn = document.getElementById('countdown-cancel');
                        
                        if (window.autoplayCountdownInterval) clearInterval(window.autoplayCountdownInterval);
                        
                        if (overlay) {
                            titleEl.innerText = nextTitleStr;
                            overlay.classList.remove('hidden');
                            overlay.classList.add('flex');
                            
                            let timeLeft = 5;
                            timerSpan.innerText = timeLeft;
                            
                            window.autoplayCountdownInterval = setInterval(() => {
                                timeLeft--;
                                timerSpan.innerText = timeLeft;
                                if (timeLeft <= 0) {
                                    clearInterval(window.autoplayCountdownInterval);
                                    window.location.hash = nextHash;
                                }
                            }, 1000);
                            
                            playNowBtn.onclick = () => {
                                clearInterval(window.autoplayCountdownInterval);
                                window.location.hash = nextHash;
                            };
                            
                            cancelBtn.onclick = () => {
                                clearInterval(window.autoplayCountdownInterval);
                                overlay.classList.remove('flex');
                                overlay.classList.add('hidden');
                            };
                        } else {
                            window.location.hash = nextHash;
                        }
                    }
                });
`;
content = content.replace(endedListenerRegex, newEndedListener.trim());

// 3. Add keyboard shortcuts in initPlayer
const initPlayerBlock = `
            if (window.playerKeydownHandler) {
                document.removeEventListener('keydown', window.playerKeydownHandler);
            }
            window.playerKeydownHandler = (e) => {
                if (window.location.hash.startsWith('#watch')) {
                    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
                    
                    if (e.code === 'Space') {
                        e.preventDefault();
                        if (video.paused) video.play();
                        else video.pause();
                    } else if (e.code === 'ArrowLeft') {
                        e.preventDefault();
                        video.currentTime = Math.max(0, video.currentTime - 10);
                    } else if (e.code === 'ArrowRight') {
                        e.preventDefault();
                        video.currentTime = Math.min(video.duration, video.currentTime + 10);
                    } else if (e.code === 'KeyF') {
                        e.preventDefault();
                        if (document.fullscreenElement) document.exitFullscreen();
                        else wrapper.requestFullscreen();
                    }
                }
            };
            document.addEventListener('keydown', window.playerKeydownHandler);
`;

content = content.replace(
    /const timeTotal = document\.getElementById\('time-total'\);/g,
    "const timeTotal = document.getElementById('time-total');\n" + initPlayerBlock
);

// 4. Also clear interval on route change just in case
content = content.replace(
    /window\.handleRoute = function\(\) \{/g,
    "window.handleRoute = function() {\n            if (window.autoplayCountdownInterval) clearInterval(window.autoplayCountdownInterval);"
);

fs.writeFileSync('index.html', content);
