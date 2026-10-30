const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetHTML = `    <!-- Netflix-style Splash Screen -->
    <div id="netflix-splash" class="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center transition-opacity duration-1000 ease-in-out">
        <div class="netflix-logo-anim-container relative scale-150 md:scale-200">
            <!-- Simulated N animation using text and drop shadow -->
            <span class="text-netflixRed text-8xl md:text-9xl font-black tracking-tighter" style="font-family: 'Arial Black', Impact, sans-serif; -webkit-text-stroke: 2px #b00710; text-shadow: 0 0 30px rgba(229,9,20,0.6);">N</span>
        </div>
        <div class="w-16 h-1 bg-gray-800 rounded-full mt-8 overflow-hidden relative">
            <div class="absolute top-0 left-0 h-full bg-netflixRed w-1/2 rounded-full animate-[ping_1s_ease-in-out_infinite]"></div>
        </div>
    </div>`;
code = code.replace(targetHTML, '');

fs.writeFileSync('index.html', code);
