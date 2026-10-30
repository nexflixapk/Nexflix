import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("document.getElementById('dm-play-text').innerText = 'Watch from Start';", "")
content = content.replace("playBtn.innerHTML = `<i class=\"fas fa-redo\"></i> <span>Watch from Start</span>`;", "playBtn.innerHTML = `<i class=\"fas fa-redo\"></i> <span id=\"dm-play-text\">Watch from Start</span>`;")
content = content.replace("playBtn.innerHTML = `<i class=\"fas fa-play\"></i> <span>Play</span>`;", "playBtn.innerHTML = `<i class=\"fas fa-play\"></i> <span id=\"dm-play-text\">Watch Movie</span>`;")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Button logic fixed via string replacement.")
