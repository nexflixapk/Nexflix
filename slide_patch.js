const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

// Add slide-down animation to Tailwind config
const configTarget = `'slow-zoom': 'slowZoom 30s ease-in-out alternate infinite'`;
const configReplace = `'slow-zoom': 'slowZoom 30s ease-in-out alternate infinite',
                        'slide-down': 'slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards'`;

const keyframesTarget = `slowZoom: {
                            '0%': { transform: 'scale(1)' },
                            '100%': { transform: 'scale(1.15)' }
                        }`;
const keyframesReplace = `slowZoom: {
                            '0%': { transform: 'scale(1)' },
                            '100%': { transform: 'scale(1.15)' }
                        },
                        slideDown: {
                            '0%': { transform: 'translateY(-100%)', opacity: '0' },
                            '100%': { transform: 'translateY(0)', opacity: '1' }
                        }`;

code = code.replace(configTarget, configReplace).replace(keyframesTarget, keyframesReplace);

const noticeBarTarget = `noticeBar.classList.remove('hidden');`;
const noticeBarReplace = `noticeBar.classList.remove('hidden');
                            noticeBar.classList.add('animate-slide-down');`;

code = code.replace(noticeBarTarget, noticeBarReplace);

fs.writeFileSync('index.html', code);
