const fs = require('fs');

const admin = fs.readFileSync('admin.html', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

console.log('=== ADMIN.HTML Live TV references ===');
['enableLiveTv', 'isLiveTvEnabled', 'liveTvEnabled', 'live-tv-toggle', 'liveTV', 'liveTv'].forEach(term => {
  let pos = 0;
  while ((pos = admin.indexOf(term, pos)) !== -1) {
    console.log(`admin.html: "${term}" at ${pos}:`, admin.substring(Math.max(0, pos - 40), Math.min(admin.length, pos + 120)).replace(/\n/g, ' '));
    pos += term.length;
  }
});

console.log('\n=== INDEX.HTML Live TV references ===');
['enableLiveTv', 'isLiveTvEnabled', 'liveTvEnabled', 'live-tv-toggle', 'liveTV', 'liveTv', '#livetv'].forEach(term => {
  let pos = 0;
  while ((pos = index.indexOf(term, pos)) !== -1) {
    console.log(`index.html: "${term}" at ${pos}:`, index.substring(Math.max(0, pos - 40), Math.min(index.length, pos + 120)).replace(/\n/g, ' '));
    pos += term.length;
  }
});
