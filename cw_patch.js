let cwList = []; try { cwList = JSON.parse(localStorage.getItem('nexora_continue_watching') || '[]'); } catch(e) {}
let showCw = cwList.filter(c => String(c.id) === String(id) && c.type === 'tv');
let showCwHtml = '';
if (showCw.length > 0) {
    showCwHtml += `<div class="mt-16 max-w-7xl mx-auto px-4 md:px-0">
        <h3 class="text-xl md:text-2xl font-bold mb-6 text-white tracking-wide"><i class="fas fa-play-circle text-netflixRed mr-2"></i> Continue Watching</h3>
        <div class="flex gap-4 overflow-x-auto pb-4 custom-scrollbar -mx-4 px-4 md:mx-0 md:px-0">`;
    
    showCw.forEach(cwItem => {
        let ep = null;
        let epNum = cwItem.episode;
        if (data.seasons && data.seasons[cwItem.season] && data.seasons[cwItem.season].episodes) {
            ep = data.seasons[cwItem.season].episodes[cwItem.episode];
            if(ep && ep.episodeNumber) epNum = ep.episodeNumber;
        }
        const epTitle = ep && ep.title ? ep.title : `Episode ${epNum}`;
        const epImage = ep && ep.still ? ep.still : data.backdrop;
        const progressPct = cwItem.duration ? (cwItem.progress / cwItem.duration) * 100 : 0;
        
        showCwHtml += `
            <a href="#watch/tv/${id}/${cwItem.season}/${cwItem.episode}" class="flex-shrink-0 w-[240px] md:w-[320px] group cursor-pointer border border-transparent hover:border-gray-700 rounded-lg p-2 transition-colors bg-gray-900/20 hover:bg-gray-800/40">
                <div class="w-full aspect-video bg-gray-900 rounded-lg overflow-hidden relative mb-3 shadow-lg">
                    <img src="${epImage}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100">
                    <div class="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                    <i class="fas fa-play absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl text-white opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all drop-shadow-lg"></i>
                    ${progressPct > 0 ? `<div class="absolute bottom-0 left-0 right-0 h-1 bg-white/20"><div class="h-full bg-netflixRed shadow-[0_0_10px_#e50914]" style="width: ${progressPct}%"></div></div>` : ''}
                    <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md">S${cwItem.season} E${epNum}</div>
                </div>
                <h4 class="font-bold text-sm md:text-base text-gray-200 line-clamp-1 group-hover:text-white transition-colors">${epTitle}</h4>
                <div class="flex items-center gap-2 mt-1">
                    ${ep && ep.runtime ? `<span class="text-[10px] md:text-xs text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">${ep.runtime}m</span>` : ''}
                    <span class="text-[10px] md:text-xs text-netflixRed font-bold uppercase tracking-widest">${Math.round(progressPct)}% Watched</span>
                </div>
            </a>
        `;
    });
    showCwHtml += `</div></div>`;
    extraHtml += showCwHtml;
}
