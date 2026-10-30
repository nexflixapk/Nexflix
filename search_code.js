const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

function findTerms(terms) {
  for (const term of terms) {
    let count = 0;
    let pos = 0;
    const indices = [];
    while ((pos = content.indexOf(term, pos)) !== -1) {
      count++;
      if (indices.length < 3) indices.push(pos);
      pos += term.length;
    }
    console.log(`Term "${term}": ${count} matches`);
    indices.forEach(idx => {
      console.log('   ->', content.substring(Math.max(0, idx - 50), Math.min(content.length, idx + 100)).replace(/\n/g, ' '));
    });
  }
}

findTerms([
  'tmdb',
  'stream_url',
  'server',
  'api.themoviedb.org',
  'autoUpdate',
  'auto_update',
  'Network / Provider',
  'network',
  'provider',
  'importMovie',
  'vidsrc',
  'embed'
]);
