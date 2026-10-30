const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const originalFetch = `        async function fetchFirebaseData(path) {
            if(!window.dbRef) return null;
            try {
                const snapshot = await get(child(window.dbRef, path));
                return snapshot.exists() ? snapshot.val() : null;
            } catch (e) {
                console.error("Firebase read error", e);
                return null;
            }
        }`;

const cachedFetch = `        window.firebaseDataCache = window.firebaseDataCache || {};
        async function fetchFirebaseData(path, forceRefresh = false) {
            if(!window.dbRef) return null;
            if (!forceRefresh && window.firebaseDataCache[path]) {
                return window.firebaseDataCache[path];
            }
            try {
                const snapshot = await get(child(window.dbRef, path));
                if (snapshot.exists()) {
                    const val = snapshot.val();
                    window.firebaseDataCache[path] = val;
                    return val;
                }
                return null;
            } catch (e) {
                console.error("Firebase read error", e);
                return null;
            }
        }`;

content = content.replace(originalFetch, cachedFetch);
fs.writeFileSync('index.html', content);
