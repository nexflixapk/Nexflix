with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

bad1 = r"onmouseenter=\"startPreview(this, \'{item.type}\', \'{item.id}\', \'{(item.title||item.name||\"\").replace(/\'/g, \"\\'").replace(/\"/g, \"&quot;\")}\', \'{item.year||\"\"}\')\"".replace('{', '${')

bad2 = r"onmouseenter=\"startPreview(this, \'{type}\', \'{item.id}\', \'{(item.title||item.name||\"\").replace(/\'/g, \"\\'").replace(/\"/g, \"&quot;\")}\', \'{item.year||\"\"}\')\"".replace('{', '${')

import re
# Just replace everything from onmouseenter to onmouseleave
content = re.sub(
    r'onmouseenter="startPreview[^"]+" onmouseleave="stopPreview\(this\)">',
    r'onmouseenter="startPreview(this, \'${item.type}\', \'${item.id}\')" onmouseleave="stopPreview(this)">',
    content
)

content = re.sub(
    r'onmouseenter="startPreview\(this, \\\'\${item\.type}\\\', \\\'\${item\.id}\\\',.*?onmouseleave="stopPreview\(this\)">',
    r'onmouseenter="startPreview(this, \'${item.type}\', \'${item.id}\')" onmouseleave="stopPreview(this)">',
    content
)

content = re.sub(
    r'onmouseenter="startPreview\(this, \\\'\${type}\\\', \\\'\${item\.id}\\\',.*?onmouseleave="stopPreview\(this\)">',
    r'onmouseenter="startPreview(this, \'${type}\', \'${item.id}\')" onmouseleave="stopPreview(this)">',
    content
)


with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
