const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Add Google Site Verification meta tag to the <head>
const headInsertTarget = `<meta charset="UTF-8">`;
const headInsertString = `<meta name="google-site-verification" content="hWiWf2H-n7d6PhqjML2cIxlg2NjqkwlmTsBSDy1Szh4" />\n    <meta charset="UTF-8">`;
code = code.replace(headInsertTarget, headInsertString);

// Update notice bar UI to look professional
const noticeBarHtmlTarget = `<div id="global-notice-bar" class="hidden w-full bg-[#E50914] text-white font-bold text-center py-2 px-4 shadow-[0_4px_10px_rgba(0,0,0,0.5)] text-sm md:text-base border-b border-white/20"></div>`;
const noticeBarHtmlReplace = `<div id="global-notice-bar" class="hidden w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-gray-300 font-medium text-center py-2 px-4 text-xs md:text-sm border-b border-white/5 relative z-[60]"></div>`;
code = code.replace(noticeBarHtmlTarget, noticeBarHtmlReplace);

// Update notice bar JS template to look professional
const noticeBarJsTarget = `noticeBar.innerHTML = \`<a href="\${noticeLink}" target="_blank" class="hover:underline flex items-center justify-center gap-2"><i class="fas fa-bell animate-pulse"></i> \${noticeText} <i class="fas fa-arrow-right text-xs"></i></a>\`;`;
const noticeBarJsReplace = `noticeBar.innerHTML = \`
                                <div class="flex items-center justify-center gap-3">
                                    <span class="bg-netflixRed/20 text-netflixRed text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-netflixRed/30 hidden sm:inline-block">Announcement</span>
                                    <a href="\${noticeLink}" target="_blank" class="hover:text-white transition-colors flex items-center gap-2 group">
                                        \${noticeText}
                                        <i class="fas fa-chevron-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
                                    </a>
                                </div>
                            \`;`;
code = code.replace(noticeBarJsTarget, noticeBarJsReplace);

// Fix iOS lag: View transitions cause issues on iOS WebKit sometimes.
// And removing heavy backdrop-filters completely on lower-end / mobile if possible
// Let's modify the view transition polyfill code and remove the heavy animations from cards

// Find the view transition block added earlier and make it respect prefers-reduced-motion
const vtCssTarget = `/* View Transitions for smooth page routing */`;
const vtCssReplace = `
        /* View Transitions for smooth page routing */
        @media (prefers-reduced-motion: reduce) {
            ::view-transition-group(*),
            ::view-transition-old(*),
            ::view-transition-new(*) {
                animation: none !important;
            }
        }`;
code = code.replace(vtCssTarget, vtCssReplace + '\n' + vtCssTarget);


// Remove heavy blur from the "liquid-glass" class which could cause iOS Safari lag
const liquidGlassTarget = `
        .liquid-glass {
            background: rgba(20, 20, 20, 0.4);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        }
`;
const liquidGlassReplace = `
        .liquid-glass {
            background: rgba(20, 20, 20, 0.85);
            /* Reduced blur for iOS performance */
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
`;
code = code.replace(liquidGlassTarget, liquidGlassReplace);

// Navbar scrolled also uses heavy blur
const navScrolledTarget = `
        .navbar-scrolled { 
            background-color: rgba(0, 0, 0, 0.5) !important; 
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }`;
const navScrolledReplace = `
        .navbar-scrolled { 
            background-color: rgba(0, 0, 0, 0.85) !important; 
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px) !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }`;
code = code.replace(navScrolledTarget, navScrolledReplace);

// Disable view transitions on iOS specifically as it's known to cause severe lag/flickering in WebKit
const routingTarget = `if (document.startViewTransition) {`;
const routingReplace = `
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
            if (document.startViewTransition && !isIOS) {`;
code = code.replace(routingTarget, routingReplace);

fs.writeFileSync('index.html', code);
