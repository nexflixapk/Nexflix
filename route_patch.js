const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const routeCalls = `
            if (hash === '#home') renderHome();
            else if (hash === '#movies') renderCategory('movie');
            else if (hash === '#tv') renderCategory('tv');
            else if (hash === '#new') renderCategory('new');
            else if (hash.startsWith('#movie/')) renderDetails(hash.split('/')[1], 'movie');
            else if (hash.startsWith('#tv/')) renderDetails(hash.split('/')[1], 'tv');
            else if (hash.startsWith('#page-')) renderCustomPage(hash.replace('#page-', ''));
            else if (hash.startsWith('#watch/')) {
                const parts = hash.split('/');
                if(parts.length >= 3) renderPlayer(parts[1], parts[2], parts[3], parts[4]);
            }
            else if (hash === '#mylist') renderMyList();
            else if (hash === '#search') renderSearch();
            else if (hash === '#history') renderHistory();
            else if (hash === '#request') renderRequest();
            else if (hash === '#rewards') renderRewards();
            else if (hash === '#profile') renderProfile();
            else renderHome();
            
            if (appContent) {
                appContent.classList.remove('animate-page-slide');
                void appContent.offsetWidth;
                appContent.classList.add('animate-page-slide');
            }
            window.scrollTo(0,0);
`;

const newRouteLogic = `
            const performRoute = () => {
                if (hash === '#home') renderHome();
                else if (hash === '#movies') renderCategory('movie');
                else if (hash === '#tv') renderCategory('tv');
                else if (hash === '#new') renderCategory('new');
                else if (hash.startsWith('#movie/')) renderDetails(hash.split('/')[1], 'movie');
                else if (hash.startsWith('#tv/')) renderDetails(hash.split('/')[1], 'tv');
                else if (hash.startsWith('#page-')) renderCustomPage(hash.replace('#page-', ''));
                else if (hash.startsWith('#watch/')) {
                    const parts = hash.split('/');
                    if(parts.length >= 3) renderPlayer(parts[1], parts[2], parts[3], parts[4]);
                }
                else if (hash === '#mylist') renderMyList();
                else if (hash === '#search') renderSearch();
                else if (hash === '#history') renderHistory();
                else if (hash === '#request') renderRequest();
                else if (hash === '#rewards') renderRewards();
                else if (hash === '#profile') renderProfile();
                else renderHome();
                
                if (appContent && !document.startViewTransition) {
                    appContent.classList.remove('animate-page-slide');
                    void appContent.offsetWidth;
                    appContent.classList.add('animate-page-slide');
                }
                window.scrollTo(0,0);
            };

            if (document.startViewTransition) {
                document.startViewTransition(() => performRoute());
            } else {
                performRoute();
            }
`;

code = code.replace(routeCalls.trim(), newRouteLogic.trim());

// Add view transition CSS
const viewTransitionCss = `
        /* View Transitions for smooth page routing */
        ::view-transition-old(root),
        ::view-transition-new(root) {
            animation-duration: 0.4s;
            animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        ::view-transition-old(root) {
            animation-name: fade-out, scale-down;
        }
        ::view-transition-new(root) {
            animation-name: fade-in, scale-up;
        }
        @keyframes fade-out { to { opacity: 0; } }
        @keyframes fade-in { from { opacity: 0; } }
        @keyframes scale-down { to { transform: scale(0.98); } }
        @keyframes scale-up { from { transform: scale(1.02); } }
`;

code = code.replace('</style>', viewTransitionCss + '\n    </style>');

fs.writeFileSync('index.html', code);
