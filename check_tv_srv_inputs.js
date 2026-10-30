const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

console.log('Searching for TV server inputs:');
['t-servers', 't-add-srv', 't-form-server', 'add-srv-url'].forEach(term => {
  let pos = 0;
  while ((pos = content.indexOf(term, pos)) !== -1) {
    console.log(`Found "${term}" at ${pos}:`, content.substring(Math.max(0, pos - 40), Math.min(content.length, pos + 100)).replace(/\n/g, ' '));
    pos += term.length;
  }
});
