const fs = require('fs');
let code = fs.readFileSync('admin.html', 'utf8');

const target = `<button type="submit" class="bg-netflixRed hover:bg-red-700 text-white font-bold py-4 px-8 rounded shadow-lg transition w-full text-xl mt-6 group">
                        <i class="fas fa-save group-hover:scale-110 transition-transform"></i> Save Settings
                    </button>`;

const replace = `<button type="submit" class="bg-netflixRed hover:bg-red-700 text-white font-bold py-4 px-8 rounded shadow-lg transition w-full text-xl mt-6 group">
                        <i class="fas fa-save group-hover:scale-110 transition-transform"></i> Save Settings
                    </button>
                    
                    <a href="/nexora-blogger-theme.xml" download class="mt-4 w-full bg-[#f37b1d] hover:bg-[#d66a15] text-white font-bold py-4 px-8 rounded shadow-lg transition flex items-center justify-center gap-2 group block text-center text-xl">
                        <i class="fab fa-blogger group-hover:scale-110 transition-transform"></i> Download for Blogger (.xml)
                    </a>`;

code = code.replace(target, replace);
fs.writeFileSync('admin.html', code);
