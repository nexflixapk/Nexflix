const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const searchStart = `appContent.innerHTML = \`
                <!-- Professional Back Button -->`;
const searchEnd = `                </div>
            \`;

            // Countdown Timer Logic`;

let startIndex = code.indexOf(searchStart);
let endIndex = code.indexOf(searchEnd, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    console.log("Found block, length: ", endIndex + searchEnd.length - startIndex);
} else {
    console.log("Could not find exact block");
}
