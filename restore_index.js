const fs = require('fs');
let indexHtml = fs.readFileSync('index.html', 'utf8');
const tempJs = fs.readFileSync('temp.js', 'utf8');

// The original index.html has:
// <script type="module">
// import { initializeApp } ...
// import { getDatabase, ...
// // CONFIGURATION

const startMarker = `        import { getDatabase, ref, get, child, push, set, remove, update, increment } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";`;
const endMarker = `    </script>
    <script>
        // Back to top functionality`;

const startIndex = indexHtml.indexOf(startMarker);
const endIndex = indexHtml.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const before = indexHtml.substring(0, startIndex + startMarker.length);
    const after = indexHtml.substring(endIndex);
    const restored = before + '\n' + tempJs + '\n' + after;
    fs.writeFileSync('index.html', restored);
    console.log("Restored successfully. New length:", restored.length);
} else {
    console.log("Markers not found");
}
