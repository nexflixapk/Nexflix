const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace(
    /<div id="header-ad-container" class="w-full max-w-7xl mx-auto px-4 pt-28 md:pt-36 text-center empty:hidden"><\/div>\\n                <div class="pt-24 md:pt-32 px-4 md:px-12/g,
    '<div id="header-ad-container" class="w-full max-w-7xl mx-auto px-4 pt-32 md:pt-36 text-center empty:hidden"></div>\\n                <div class="pt-32 md:pt-36 px-4 md:px-12'
);

content = content.replace(
    /<input type="text" autocomplete="off" id="search-input" placeholder="Search movies, shows, genres\.\.\." class="w-full bg-transparent text-white text-xl md:text-2xl outline-none placeholder-gray-500 py-2">/g,
    '<input type="text" autocomplete="off" id="search-input" placeholder="Search..." class="w-full bg-transparent text-white text-base md:text-xl outline-none placeholder-gray-500 py-1 md:py-2">'
);

content = content.replace(
    /class="absolute top-full left-0 right-0 mt-3 bg-gray-900\/95 backdrop-blur-xl border border-gray-700\/50 rounded-2xl shadow-2xl overflow-hidden hidden flex-col z-50"/g,
    'class="absolute top-full left-0 right-0 mt-3 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-y-auto max-h-[50vh] hidden flex-col z-50 no-scrollbar"'
);

// Search icon
content = content.replace(
    /<i class="fas fa-search text-2xl text-gray-400 group-focus-within:text-netflixRed transition-colors mr-4"><\/i>/g,
    '<i class="fas fa-search text-xl md:text-2xl text-gray-400 group-focus-within:text-netflixRed transition-colors mr-3 md:mr-4"></i>'
);

// Close button
content = content.replace(
    /id="clear-search-btn" class="text-2xl text-gray-400 hover:text-white transition-colors ml-4 hidden"/g,
    'id="clear-search-btn" class="text-xl md:text-2xl text-gray-400 hover:text-white transition-colors ml-3 md:ml-4 hidden"'
);

fs.writeFileSync('index.html', content);
