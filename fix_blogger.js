const fs = require('fs');

let html = fs.readFileSync('dist/index.html', 'utf8');

html = html.replace(/<!DOCTYPE html>/i, '');
html = html.replace(/<html.*?>/i, '');
html = html.replace(/<\/html>/i, '');

const headMatch = html.match(/<head>([\s\S]*?)<\/head>/i);
const bodyMatch = html.match(/<body>([\s\S]*?)<\/body>/i);

let headContent = headMatch ? headMatch[1] : '';
let bodyContent = bodyMatch ? bodyMatch[1] : '';

headContent = headContent.replace(/crossorigin\s*>/gi, 'crossorigin="anonymous">');
bodyContent = bodyContent.replace(/crossorigin\s*>/gi, 'crossorigin="anonymous">');
headContent = headContent.replace(/crossorigin\s/gi, 'crossorigin="anonymous" ');
bodyContent = bodyContent.replace(/crossorigin\s/gi, 'crossorigin="anonymous" ');

function escapeAmpersands(content) {
    let parts = [];
    let regex = /(<(script|style)[^>]*>[\s\S]*?<\/\2>)/gi;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        let textBefore = content.substring(lastIndex, match.index);
        textBefore = textBefore.replace(/&(?!(amp|lt|gt|quot|apos|#\d+);)/g, '&amp;');
        parts.push(textBefore);
        parts.push(match[0]);
        lastIndex = regex.lastIndex;
    }
    let textAfter = content.substring(lastIndex);
    textAfter = textAfter.replace(/&(?!(amp|lt|gt|quot|apos|#\d+);)/g, '&amp;');
    parts.push(textAfter);
    return parts.join('');
}

headContent = escapeAmpersands(headContent);
bodyContent = escapeAmpersands(bodyContent);

function closeTags(content) {
    const voidElements = ['meta', 'link', 'img', 'input', 'br', 'hr', 'source', 'track', 'area', 'col'];
    voidElements.forEach(tag => {
        const regex = new RegExp(`<${tag}\\b([^>]*?)(?<!/)>`, 'gi');
        content = content.replace(regex, `<${tag}$1 />`);
    });
    return content;
}

function wrapCdata(content) {
    return content.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, scriptContent) => {
        if (!scriptContent.trim()) return match;
        return `<script${attrs}>\n//<![CDATA[\n${scriptContent}\n//]]>\n</script>`;
    });
}

function wrapCdataStyle(content) {
    return content.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (match, attrs, styleContent) => {
        if (!styleContent.trim()) return match;
        return `<style${attrs}>\n/*<![CDATA[*/\n${styleContent}\n/*]]>*/\n</style>`;
    });
}

headContent = headContent.replace(/<meta charset="UTF-8" \/>/gi, '');
headContent = headContent.replace(/<meta charset="UTF-8">/gi, '');
headContent = headContent.replace(/<meta name="viewport".*?>/gi, '<meta name="viewport" content="width=device-width, initial-scale=1.0" />');

headContent = closeTags(headContent);
headContent = wrapCdata(headContent);
headContent = wrapCdataStyle(headContent);

bodyContent = closeTags(bodyContent);
bodyContent = wrapCdata(bodyContent);
bodyContent = wrapCdataStyle(bodyContent);

function fixBooleanAttributes(content) {
    const boolAttrs = ['disabled', 'checked', 'selected', 'readonly', 'required', 'multiple', 'hidden', 'defer', 'async', 'autofocus'];
    boolAttrs.forEach(attr => {
        const regex = new RegExp(`\\s${attr}(?=[\\s/>])`, 'gi');
        content = content.replace(regex, ` ${attr}="${attr}"`);
    });
    return content;
}

headContent = fixBooleanAttributes(headContent);
bodyContent = fixBooleanAttributes(bodyContent);

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
console.log('Fixed Blogger XML generated successfully!');

let adminHtml = fs.readFileSync('admin.html', 'utf8');
const b64 = Buffer.from(bloggerXml).toString('base64');
const dataUri = `data:text/xml;base64,${b64}`;

adminHtml = adminHtml.replace(/href="data:text\/xml;base64,[^"]*"/, `href="${dataUri}"`);
fs.writeFileSync('admin.html', adminHtml);
console.log('Injected Data URI into admin.html');
