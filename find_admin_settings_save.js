const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

function findTerms(terms) {
  terms.forEach(t => {
    let pos = 0;
    while ((pos = content.indexOf(t, pos)) !== -1) {
      console.log(`\n=== "${t}" at ${pos} ===`);
      console.log(content.substring(Math.max(0, pos - 40), Math.min(content.length, pos + 300)).replace(/\n/g, ' '));
      pos += t.length;
    }
  });
}

findTerms([
  'set-livetv-enabled',
  'dedicated-livetv-toggle',
  'settings-form',
  'saveSettings'
]);
