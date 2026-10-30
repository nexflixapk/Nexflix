const fs = require('fs');
const content = fs.readFileSync('admin.html', 'utf8');

let pos = 0;
while ((pos = content.indexOf('saveMovie', pos)) !== -1) {
  console.log(`saveMovie at ${pos}:`);
  console.log(content.substring(Math.max(0, pos - 50), Math.min(content.length, pos + 250)).replace(/\n/g, ' '));
  pos += 'saveMovie'.length;
}
