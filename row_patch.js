const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetStr = `items.forEach(item => {`;
const replaceStr = `items.forEach((item, index) => {`;

code = code.replace(targetStr, replaceStr);

const targetA = `class="flex-none w-[140px] md:w-[220px] relative rounded-xl overflow-hidden transition-all duration-300 card-hover cursor-pointer bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] aspect-[2/3] block group"`;
const replaceA = `class="flex-none w-[140px] md:w-[220px] relative rounded-xl overflow-hidden transition-all duration-300 card-hover cursor-pointer bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.15)] aspect-[2/3] block group animate-fade-in-up" style="animation-delay: \${(index * 50) % 500}ms; opacity: 0;"`;

code = code.replace(targetA, replaceA);

fs.writeFileSync('index.html', code);
