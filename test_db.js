// Read the index.html and extract the mock data if any
const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');
const match = content.match(/window\.appSettings = (\{.*?\});/);
console.log(match ? "AppSettings found" : "No AppSettings");
