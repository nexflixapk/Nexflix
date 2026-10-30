const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// 1. Add Service Worker Registration
const swCode = `
    <!-- PWA Registration & Install -->
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(reg => {
                    console.log('SW registered!', reg);
                }).catch(err => console.log('SW failed', err));
            });
        }
        
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            const installBtn = document.getElementById('install-app-btn');
            if (installBtn) {
                installBtn.classList.remove('hidden');
                installBtn.classList.add('flex');
            }
        });
        
        window.installApp = async function() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                deferredPrompt = null;
                const installBtn = document.getElementById('install-app-btn');
                if (installBtn) {
                    installBtn.classList.add('hidden');
                    installBtn.classList.remove('flex');
                }
            }
        };
    </script>
`;

if (!code.includes('serviceWorker')) {
    code = code.replace('</head>', swCode + '</head>');
}

// 2. Add Install App Button in the Navbar next to Notifications
const installBtnHtml = `
                <!-- Install App Button -->
                <button id="install-app-btn" onclick="window.installApp()" class="hidden items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-full text-sm font-bold transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] mr-2 whitespace-nowrap group">
                    <i class="fas fa-download text-white group-hover:animate-bounce"></i>
                    <span class="hidden md:inline">Install App</span>
                </button>
`;

// Find the profile/notification area to insert
code = code.replace('<!-- Notification Dropdown -->', installBtnHtml + '\n                <!-- Notification Dropdown -->');

// 3. Optimize laggy things:
// Reduce backdrop-blur on list items which destroys mobile performance
code = code.replace(/backdrop-blur-md/g, 'backdrop-blur-sm');

// Remove 30s background animation on user login which is heavy on GPU
code = code.replace(/animate-bg-3d/g, 'transition-transform duration-1000'); // simpler 

// Adjust view transition duration to be snappier and not block interaction too long
code = code.replace(/animation-duration: 0.4s;/g, 'animation-duration: 0.25s;');

fs.writeFileSync('index.html', code);
