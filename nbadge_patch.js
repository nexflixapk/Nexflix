const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Apply Netflix-style pulse to N-Badge
const target = `
        /* N Badge on cards */
        .n-badge {
`;
const replacement = `
        /* N Badge on cards */
        .n-badge {
            animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            animation-delay: 0.2s;
`;

code = code.replace(target, replacement);
fs.writeFileSync('index.html', code);
