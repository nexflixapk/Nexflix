const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// I will extract everything from appContent.innerHTML = ` until the end of that template literal.
// Wait, I can just replace the whole HTML block.

const searchStart = `appContent.innerHTML = \`
                <!-- Professional Back Button -->`;
const searchEnd = `                </div>\`;`;

let startIndex = code.indexOf(searchStart);
let endIndex = code.indexOf(searchEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    console.log("Found block, length: ", endIndex - startIndex);
} else {
    console.log("Could not find exact block, let's search via regex or smaller strings.");
}

