const fs = require('fs');
let code = fs.readFileSync('admin.html', 'utf8');

const target = `<i class="fas fa-save group-hover:scale-110 transition-transform"></i> Save Settings
                    </button>
                </div>
            </div>`;

const replace = `<i class="fas fa-save group-hover:scale-110 transition-transform"></i> Save Settings
                    </button>
                    
                    <a href="/nexora-blogger-theme.xml" download class="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group block text-center">
                        <i class="fab fa-blogger group-hover:scale-110 transition-transform"></i> Download Blogger Theme (.xml)
                    </a>
                </div>
            </div>`;

code = code.replace(target, replace);
fs.writeFileSync('admin.html', code);
