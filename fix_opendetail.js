const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const regex = /(document\.getElementById\('dm-(?:release-date|poster-img|title-text|original-title|desc-text|year-text|duration-text|rating-val|country|lang)'\))(.*?);/g;

content = content.replace(regex, function(match, p1, p2) {
    return `if(${p1}) ${p1}${p2};`;
});

// Also need to set dm-cast-text and dm-genres-text which we added
const castLogicRegex = /if \(activeContent\.castData && activeContent\.castData\.length > 0\) \{([\s\S]*?)\} else \{([\s\S]*?)\}/;

const newCastLogic = `
            if (activeContent.castData && activeContent.castData.length > 0) {
                const castNames = activeContent.castData.slice(0, 5).map(c => c.name).join(', ');
                if(document.getElementById('dm-cast-text')) document.getElementById('dm-cast-text').innerText = castNames;
            } else {
                if(document.getElementById('dm-cast-text')) document.getElementById('dm-cast-text').innerText = 'N/A';
            }
            if (activeContent.genre) {
                if(document.getElementById('dm-genres-text')) document.getElementById('dm-genres-text').innerText = activeContent.genre;
            }
`;
content = content.replace(castLogicRegex, newCastLogic);

fs.writeFileSync('index.html', content);
