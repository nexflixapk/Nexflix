const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace("appContent.innerHTML = \\`<div class=\\\"h-screen bg-[#141414]", "appContent.innerHTML = `<div class=\\\"h-screen bg-[#141414]");
content = content.replace("inline-block\\\">Go Back</a></div>\\`;", "inline-block\\\">Go Back</a></div>`;");

fs.writeFileSync('index.html', content);
