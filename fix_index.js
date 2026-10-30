const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const targetStr = `items.forEach(item => {                
                // Fix: Ensure we correctly handle TV show links in CW`;
const replaceStr = `items.forEach((item, index) => {                
                // Fix: Ensure we correctly handle TV show links in CW`;

code = code.replace(targetStr, replaceStr);

// Let's also check for any other ones that might be broken
fs.writeFileSync('index.html', code);
