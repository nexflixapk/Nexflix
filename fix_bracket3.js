const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

content = content.replace("localStorage.setItem('nexora_continue_watching', JSON.stringify(cwList)); {", "localStorage.setItem('nexora_continue_watching', JSON.stringify(cwList));");

fs.writeFileSync('index.html', content);
