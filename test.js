const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const html = fs.readFileSync('index.html', 'utf8');

const dom = new JSDOM(html, { runScripts: "outside-only" });
const window = dom.window;
global.window = window;
global.document = window.document;

console.log("Checking for script errors...");
