const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetA = `class="bg-white text-black px-6 md:px-8 py-2 md:py-2.5 rounded flex items-center gap-2 font-bold hover:bg-white/80 transition text-base md:text-lg shadow-sm hover:scale-105 active:scale-95 duration-200"`;
const replaceA = `class="bg-white text-black px-6 md:px-8 py-2 md:py-2.5 rounded flex items-center gap-2 font-bold hover:bg-white/80 transition text-base md:text-lg shadow-sm hover:scale-105 active:scale-95 duration-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"`;

code = code.replace(targetA, replaceA);

const targetB = `class="bg-[#6d6d6e]/70 backdrop-blur-md text-white px-6 md:px-8 py-2 md:py-2.5 rounded flex items-center gap-2 font-bold hover:bg-[#6d6d6e]/50 transition text-base md:text-lg shadow-sm hover:scale-105 active:scale-95 duration-200 ring-1 ring-white/20"`;
const replaceB = `class="bg-[#6d6d6e]/70 backdrop-blur-md text-white px-6 md:px-8 py-2 md:py-2.5 rounded flex items-center gap-2 font-bold hover:bg-[#6d6d6e]/50 transition text-base md:text-lg shadow-sm hover:scale-105 active:scale-95 duration-200 ring-1 ring-white/20 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"`;

// Replace both occurrences of targetB
code = code.split(targetB).join(replaceB);

fs.writeFileSync('index.html', code);
