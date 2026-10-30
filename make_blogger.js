const fs = require('fs');

let html = fs.readFileSync('dist/index.html', 'utf8');

// Strip out HTML doc declarations
html = html.replace(/<!DOCTYPE html>/i, '');
html = html.replace(/<html.*?>/i, '');
html = html.replace(/<\/html>/i, '');

// Extract Head and Body
const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/i);

let headContent = headMatch ? headMatch[1] : '';
let bodyContent = bodyMatch ? bodyMatch[1] : '';

// Function to close self-closing tags
function closeTags(content) {
    const voidElements = ['meta', 'link', 'img', 'input', 'br', 'hr'];
    voidElements.forEach(tag => {
        // Matches <tag ... > but not <tag ... />
        const regex = new RegExp(`<${tag}\\b([^>]*?)(?<!/)>`, 'gi');
        content = content.replace(regex, `<${tag}$1 />`);
    });
    return content;
}

// Function to wrap scripts in CDATA
function wrapCdata(content) {
    return content.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, scriptContent) => {
        if (!scriptContent.trim()) return match;
        return `<script${attrs}>\n//<![CDATA[\n${scriptContent}\n//]]>\n</script>`;
    });
}

// Function to wrap styles in CDATA
function wrapCdataStyle(content) {
    return content.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (match, attrs, styleContent) => {
        if (!styleContent.trim()) return match;
        return `<style${attrs}>\n/*<![CDATA[*/\n${styleContent}\n/*]]>*/\n</style>`;
    });
}

// Ensure charset meta is removed, Blogger injects its own
headContent = headContent.replace(/<meta charset="UTF-8" \/>/gi, '');

headContent = closeTags(headContent);
headContent = wrapCdata(headContent);
headContent = wrapCdataStyle(headContent);

bodyContent = closeTags(bodyContent);
bodyContent = wrapCdata(bodyContent);
bodyContent = wrapCdataStyle(bodyContent);

// Construct Blogger XML
const bloggerXml = `<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE html>
<html b:css='false' b:defaultwidgetversion='2' b:layoutsVersion='3' b:responsive='true' expr:dir='data:blog.languageDirection' xmlns='http://www.w3.org/1999/xhtml' xmlns:b='http://www.google.com/2005/gml/b' xmlns:data='http://www.google.com/2005/gml/data' xmlns:expr='http://www.google.com/2005/gml/expr'>
<head>
<b:skin><![CDATA[
/* Nexora Blogger Theme */
]]></b:skin>
${headContent}
</head>
<body>
<b:section id='main' class='main' showaddelement='yes' style='display:none;'/>
${bodyContent}
</body>
</html>`;

fs.writeFileSync('public/nexora-blogger-theme.xml', bloggerXml);
console.log('public/nexora-blogger-theme.xml generated successfully!');
