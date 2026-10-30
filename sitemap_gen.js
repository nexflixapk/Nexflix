const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const sitemapBtnTarget = `<!-- Footer -->`;
const sitemapBtnReplace = `
    <!-- Sitemap Modal -->
    <div id="sitemap-modal" class="fixed inset-0 z-[120] hidden items-center justify-center opacity-0 transition-opacity duration-300 overflow-hidden">
        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm" onclick="closeSitemapModal()"></div>
        <div class="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl w-full mx-4 shadow-2xl relative max-h-[80vh] overflow-y-auto no-scrollbar" id="sitemap-content">
            <div class="sticky top-0 bg-gray-900/95 backdrop-blur z-10 p-6 border-b border-gray-800 flex justify-between items-center">
                <h2 class="text-2xl font-bold flex items-center gap-2"><i class="fas fa-sitemap text-netflixRed"></i> Website Sitemap</h2>
                <button onclick="closeSitemapModal()" class="text-gray-400 hover:text-white transition"><i class="fas fa-times text-xl"></i></button>
            </div>
            <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm" id="sitemap-grid">
                <!-- Injected via JS -->
            </div>
        </div>
    </div>
    
    <!-- Footer -->`;

code = code.replace(sitemapBtnTarget, sitemapBtnReplace);

const footerLinksTarget = `<a href="#" class="hover:underline">Legal Notices</a>`;
const footerLinksReplace = `<a href="#" class="hover:underline">Legal Notices</a>
                            <a href="#" onclick="event.preventDefault(); openSitemapModal();" class="hover:underline">Sitemap</a>`;

code = code.replace(footerLinksTarget, footerLinksReplace);

const scriptTarget = `window.hideUserLogin = function() {`;
const scriptReplace = `
        window.openSitemapModal = function() {
            const modal = document.getElementById('sitemap-modal');
            const grid = document.getElementById('sitemap-grid');
            
            let html = \`
                <div>
                    <h3 class="font-bold text-white mb-4 border-b border-gray-800 pb-2">Main Pages</h3>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="#home" onclick="closeSitemapModal()" class="hover:text-netflixRed transition">Home</a></li>
                        <li><a href="#movies" onclick="closeSitemapModal()" class="hover:text-netflixRed transition">Movies</a></li>
                        <li><a href="#tv" onclick="closeSitemapModal()" class="hover:text-netflixRed transition">TV Shows</a></li>
                        <li><a href="#new" onclick="closeSitemapModal()" class="hover:text-netflixRed transition">New & Popular</a></li>
                        <li><a href="#mylist" onclick="closeSitemapModal()" class="hover:text-netflixRed transition">My List</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="font-bold text-white mb-4 border-b border-gray-800 pb-2">User Area</h3>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="#profile" onclick="closeSitemapModal()" class="hover:text-netflixRed transition">Account & Profile</a></li>
                        <li><a href="#history" onclick="closeSitemapModal()" class="hover:text-netflixRed transition">Viewing History</a></li>
                        <li><a href="#rewards" onclick="closeSitemapModal()" class="hover:text-netflixRed transition">Rewards & Badges</a></li>
                        <li><a href="#request" onclick="closeSitemapModal()" class="hover:text-netflixRed transition">Request Content</a></li>
                        <li><a href="#search" onclick="closeSitemapModal()" class="hover:text-netflixRed transition">Advanced Search</a></li>
                    </ul>
                </div>
                <div>
                    <h3 class="font-bold text-white mb-4 border-b border-gray-800 pb-2">Legal & Others</h3>
                    <ul class="space-y-2 text-gray-400">
                        <li><a href="/admin.html" class="hover:text-netflixRed transition">Admin Panel</a></li>
                        <li><a href="#" class="hover:text-netflixRed transition">Privacy Policy</a></li>
                        <li><a href="#" class="hover:text-netflixRed transition">Terms of Service</a></li>
                        <li><a href="#" class="hover:text-netflixRed transition">Help Center</a></li>
                    </ul>
                </div>
            \`;
            
            grid.innerHTML = html;
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            setTimeout(() => modal.classList.remove('opacity-0'), 10);
            document.body.style.overflow = 'hidden';
        };
        
        window.closeSitemapModal = function() {
            const modal = document.getElementById('sitemap-modal');
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                document.body.style.overflow = '';
            }, 300);
        };

window.hideUserLogin = function() {`;

code = code.replace(scriptTarget, scriptReplace);

fs.writeFileSync('index.html', code);
